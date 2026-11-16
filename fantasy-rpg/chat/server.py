"""Run: python3 server.py. Python standard library only."""
import hashlib
from contextlib import contextmanager
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import secrets
import sqlite3
import threading
from urllib.parse import urlparse

from engine import SCENES, ModelError, generate, settings

ROOT = Path(__file__).resolve().parent
DB = Path(os.getenv("FANTASY_DB", str(ROOT / "data" / "chat.sqlite3")))
LOCKS = [threading.Lock() for _ in range(128)]
MAX_TURNS = 40  # Retain all turns in the model context; never silently drop memories.


@contextmanager
def connect():
    DB.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DB)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, scene TEXT NOT NULL)")
    db.execute("CREATE TABLE IF NOT EXISTS turns (session TEXT NOT NULL, n INTEGER NOT NULL, request_id TEXT NOT NULL, text TEXT NOT NULL, panels TEXT NOT NULL, PRIMARY KEY(session,n), UNIQUE(session,request_id))")
    try:
        with db:
            yield db
    finally:
        db.close()


def read_state(sid):
    with connect() as db:
        session = db.execute("SELECT scene FROM sessions WHERE id=?", (sid,)).fetchone()
        if not session:
            return None
        rows = db.execute("SELECT n,request_id,text,panels FROM turns WHERE session=? ORDER BY n", (sid,)).fetchall()
    return {"scene": session["scene"], "turns": [{**dict(row), "panels": json.loads(row["panels"])} for row in rows]}


def new_session(scene):
    sid = secrets.token_urlsafe(32)
    with connect() as db:
        db.execute("INSERT INTO sessions VALUES (?,?)", (sid, scene))
    return sid


def take_turn(sid, text, request_id, expected_turn):
    lock = LOCKS[int(hashlib.sha256(sid.encode()).hexdigest(), 16) % len(LOCKS)]
    if not lock.acquire(blocking=False):
        return 409, {"error": "앞선 대화가 진행 중입니다. 잠시 후 다시 시도해 주세요."}
    try:
        state = read_state(sid)
        if not state:
            return 404, {"error": "대화를 찾을 수 없습니다."}
        prior = next((t for t in state["turns"] if t["request_id"] == request_id), None)
        if prior:
            if prior["text"] != text:
                return 409, {"error": "같은 요청 번호에 다른 입력이 있습니다."}
            return 200, {"turn": prior}
        if expected_turn != len(state["turns"]):
            return 409, {"error": "다른 창에서 대화가 바뀌었습니다. 새로고침 후 다시 입력해 주세요."}
        if len(state["turns"]) >= MAX_TURNS:
            return 409, {"error": "이 연습 장면은 40회까지 이어집니다. 기록을 내려받고 새 장면을 시작해 주세요."}
        panels = generate(state["scene"], state["turns"] + [{"text": text}])
        turn = {"n": len(state["turns"]) + 1, "request_id": request_id, "text": text, "panels": panels}
        # Commit user+model pair only after a successful, validated response.
        with connect() as db:
            db.execute("INSERT INTO turns VALUES (?,?,?,?,?)", (sid, turn["n"], request_id, text, json.dumps(panels, ensure_ascii=False)))
        return 200, {"turn": turn}
    except ModelError as error:
        return 503, {"error": str(error)}
    finally:
        lock.release()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass  # No dialogue text, API keys, or session cookies in request logs.

    def reply(self, code, body, cookie=None, content_type="application/json; charset=utf-8"):
        data = json.dumps(body, ensure_ascii=False).encode() if isinstance(body, (dict, list)) else body
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy", "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'")
        if cookie:
            secure = "; Secure" if os.getenv("FANTASY_SECURE_COOKIE") == "1" else ""
            self.send_header("Set-Cookie", "fantasy_session=" + cookie + "; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000" + secure)
        self.end_headers()
        self.wfile.write(data)

    def session(self):
        try:
            cookie = SimpleCookie(self.headers.get("Cookie", ""))
            sid = cookie["fantasy_session"].value if "fantasy_session" in cookie else ""
        except Exception:
            sid = ""
        if len(sid) <= 100 and sid and read_state(sid):
            return sid, False
        return new_session("subway"), True

    def do_GET(self):
        path = urlparse(self.path).path
        if path in ("/api/state", "/api/export"):
            sid, created = self.session()
            state = read_state(sid)
            if path == "/api/state":
                cfg = settings()
                state.update(scenes={k: {key: v[key] for key in ("title", "caption", "opening", "speaker", "suggestions")} for k, v in SCENES.items()}, configured=bool(cfg["model"] and (cfg["provider"] != "openai" or cfg["key"])), max_turns=MAX_TURNS)
            self.reply(200, state, sid if created else None)
            return
        files = {"/": ("index.html", "text/html; charset=utf-8"), "/app.js": ("app.js", "text/javascript; charset=utf-8"), "/style.css": ("style.css", "text/css; charset=utf-8")}
        if path not in files:
            self.reply(404, {"error": "찾을 수 없는 주소입니다."})
            return
        name, mime = files[path]
        self.reply(200, (ROOT / "public" / name).read_bytes(), content_type=mime)

    def do_POST(self):
        origin = self.headers.get("Origin")
        if origin and urlparse(origin).netloc != self.headers.get("Host"):
            self.reply(403, {"error": "다른 사이트에서 보낸 요청은 허용하지 않습니다."})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 8192:
                raise ValueError()
            obj = json.loads(self.rfile.read(length))
            if not isinstance(obj, dict):
                raise ValueError()
        except (ValueError, TypeError, UnicodeError):
            self.reply(400, {"error": "요청 형식이 올바르지 않습니다."})
            return
        path = urlparse(self.path).path
        if path == "/api/session":
            scene = obj.get("scene")
            if not isinstance(scene, str) or scene not in SCENES:
                self.reply(400, {"error": "없는 장면입니다."})
                return
            sid = new_session(scene)
            self.reply(200, read_state(sid), sid)
            return
        if path == "/api/chat":
            text, rid, expected = obj.get("text"), obj.get("request_id"), obj.get("expected_turn")
            if not isinstance(text, str) or not 1 <= len(text.strip()) <= 800 or not isinstance(rid, str) or not 8 <= len(rid) <= 80 or type(expected) is not int:
                self.reply(400, {"error": "대화는 1~800자여야 합니다."})
                return
            sid, created = self.session()
            code, result = take_turn(sid, text.strip(), rid, expected)
            self.reply(code, result, sid if created else None)
            return
        self.reply(404, {"error": "찾을 수 없는 주소입니다."})


if __name__ == "__main__":
    address = (os.getenv("HOST", "127.0.0.1"), int(os.getenv("PORT", "8090")))
    print(f"판타지 대화 시제품: http://{address[0]}:{address[1]}", flush=True)
    ThreadingHTTPServer(address, Handler).serve_forever()
