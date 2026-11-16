"""Inspect installation/login only; does not run a model turn."""
import json
from codex_bridge import connection_status

if __name__ == "__main__":
    status = connection_status(force=True)
    print(json.dumps(status, ensure_ascii=False, indent=2))
    raise SystemExit(0 if status["ready"] else 1)
