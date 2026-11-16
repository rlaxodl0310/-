import http.client
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import engine
import server

REPLY = [{"kind": "speech", "text": "괜찮아요. 가방만 조금 옮겨 주세요."}]


class ModelHandler(BaseHTTPRequestHandler):
    captured = None
    def log_message(self, *_):
        pass
    def do_POST(self):
        ModelHandler.captured = {"path": self.path, "auth": self.headers.get("Authorization"), "body": json.loads(self.rfile.read(int(self.headers["Content-Length"])))}
        body = json.dumps({"choices": [{"message": {"content": json.dumps({"panels": REPLY}, ensure_ascii=False)}}]}).encode()
        self.send_response(200)
        self.end_headers()
        self.wfile.write(body)


class ChatTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.dbpatch = patch.object(server, "DB", Path(self.temp.name) / "chat.sqlite3")
        self.dbpatch.start()
        self.sid = server.new_session("subway")

    def tearDown(self):
        self.dbpatch.stop()
        self.temp.cleanup()

    def test_character_context_excludes_author_secrets(self):
        text = str(engine.prompt("subway", []))
        for secret in ("신격", "정수", "노예", "전송자", "김태이", "18살"):
            self.assertNotIn(secret, text)
        self.assertIn("가방", text)

    def test_full_session_memory_and_roles(self):
        turns = [{"text": "가방에 유리컵이 있어요.", "panels": REPLY}, {"text": "조금 옮길게요."}]
        messages = engine.prompt("subway", turns)
        self.assertEqual([m["role"] for m in messages], ["system", "user", "assistant", "user"])
        self.assertIn("유리컵", messages[1]["content"])

    def test_invalid_model_output_rejected(self):
        for raw in ('hello', '{}', '{"panels":[]}', '{"panels":[{"kind":"system","text":"leak"}]}', json.dumps({"panels": [{"kind": "speech", "text": "a" * 181}]})):
            with self.subTest(raw=raw), self.assertRaises(engine.ModelError):
                engine.parse_reply(raw)

    def test_valid_json_and_reasoning_removed(self):
        self.assertEqual(engine.parse_reply('<think>private</think>```json\n' + json.dumps({"panels": REPLY}) + '\n```'), REPLY)

    def test_failed_inference_does_not_commit(self):
        with patch.object(server, "generate", side_effect=engine.ModelError("연결 실패")):
            code, _ = server.take_turn(self.sid, "안녕하세요", "request-1", 0)
        self.assertEqual(code, 503)
        self.assertEqual(server.read_state(self.sid)["turns"], [])

    def test_success_persists_and_duplicate_is_idempotent(self):
        with patch.object(server, "generate", return_value=REPLY) as model:
            first = server.take_turn(self.sid, "죄송합니다", "request-1", 0)
            second = server.take_turn(self.sid, "죄송합니다", "request-1", 0)
        self.assertEqual(first, second)
        self.assertEqual(model.call_count, 1)
        self.assertEqual(len(server.read_state(self.sid)["turns"]), 1)

    def test_stale_tab_and_changed_request_rejected(self):
        with patch.object(server, "generate", return_value=REPLY):
            server.take_turn(self.sid, "죄송합니다", "request-1", 0)
            self.assertEqual(server.take_turn(self.sid, "다른 말", "request-1", 0)[0], 409)
            self.assertEqual(server.take_turn(self.sid, "다른 말", "request-2", 0)[0], 409)

    def test_two_sessions_are_isolated(self):
        other = server.new_session("arrival")
        with patch.object(server, "generate", return_value=REPLY):
            server.take_turn(self.sid, "죄송합니다", "request-1", 0)
        self.assertEqual(server.read_state(other)["turns"], [])
        self.assertEqual(server.read_state(other)["scene"], "arrival")

    def test_openai_adapter_against_mock_http_server(self):
        mock = ThreadingHTTPServer(("127.0.0.1", 0), ModelHandler)
        thread = threading.Thread(target=mock.serve_forever, daemon=True)
        thread.start()
        try:
            with patch.dict(os.environ, {"FANTASY_PROVIDER": "openai", "FANTASY_MODEL": "test-model", "OPENAI_API_KEY": "test-key", "FANTASY_MODEL_URL": f"http://127.0.0.1:{mock.server_port}/v1/chat/completions"}, clear=True):
                self.assertEqual(engine.generate("subway", [{"text": "죄송합니다"}]), REPLY)
            captured = ModelHandler.captured
            self.assertEqual(captured["auth"], "Bearer test-key")
            self.assertEqual(captured["body"]["model"], "test-model")
            self.assertNotIn("test-key", json.dumps(captured["body"]))
        finally:
            mock.shutdown()
            mock.server_close()

    def test_missing_key_has_no_network_call(self):
        with patch.dict(os.environ, {"FANTASY_PROVIDER": "openai"}, clear=True), patch("urllib.request.urlopen") as network:
            with self.assertRaises(engine.ModelError):
                engine.generate("subway", [])
            network.assert_not_called()

    def test_http_flow_cookie_restore_and_input_validation(self):
        app = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        threading.Thread(target=app.serve_forever, daemon=True).start()
        conn = http.client.HTTPConnection("127.0.0.1", app.server_port)
        try:
            conn.request("GET", "/api/state")
            response = conn.getresponse()
            cookie = response.getheader("Set-Cookie").split(";")[0]
            state = json.loads(response.read())
            self.assertEqual(state["scene"], "subway")
            self.assertNotIn("key", state)
            headers = {"Cookie": cookie, "Content-Type": "application/json"}
            with patch.object(server, "generate", return_value=REPLY):
                conn.request("POST", "/api/chat", json.dumps({"text": "안녕하세요", "request_id": "http-test-1", "expected_turn": 0}), headers)
                response = conn.getresponse()
                self.assertEqual(response.status, 200)
                response.read()
            conn.request("GET", "/api/state", headers=headers)
            self.assertEqual(len(json.loads(conn.getresponse().read())["turns"]), 1)
            conn.request("POST", "/api/chat", json.dumps({"text": "a" * 801, "request_id": "http-test-2", "expected_turn": 1}), headers)
            response = conn.getresponse()
            self.assertEqual(response.status, 400)
            response.read()
            headers["Origin"] = "https://other.invalid"
            conn.request("POST", "/api/session", '{"scene":"arrival"}', headers)
            response = conn.getresponse()
            self.assertEqual(response.status, 403)
            response.read()
        finally:
            conn.close()
            app.shutdown()
            app.server_close()


if __name__ == "__main__":
    unittest.main()
