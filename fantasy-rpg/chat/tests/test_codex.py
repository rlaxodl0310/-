import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
from unittest.mock import Mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import codex_bridge as bridge
import engine
import server

HELP = "--ignore-user-config --ignore-rules --ephemeral --output-schema --json"
REPLY = '{"panels":[{"kind":"speech","text":"아, 괜찮아요."}]}'


def ready_invocation(args, **kwargs):
    if args[-2:] == ["login", "status"]:
        return 0, "", "Logged in using ChatGPT"
    if args[-2:] == ["exec", "--help"]:
        return 0, HELP, ""
    return 0, '\n'.join([json.dumps({"type": "item.completed", "item": {"type": "agent_message", "text": REPLY}}), '{"type":"turn.completed"}']), ""


class CodexTests(unittest.TestCase):
    def setUp(self):
        bridge.STATUS_CACHE = None
        self.env = patch.dict(os.environ, {"FANTASY_PROVIDER": "codex"}, clear=True)
        self.env.start()
        self.cmd = patch.object(bridge, "command", return_value=["/mock/codex"])
        self.cmd.start()

    def tearDown(self):
        self.cmd.stop()
        self.env.stop()
        bridge.STATUS_CACHE = None

    def test_subscription_is_default(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(engine.settings()["provider"], "codex")

    def test_local_host_only(self):
        handler = object.__new__(server.Handler)
        handler.reply = Mock()
        for host in ("evil.example:8090", "127.0.0.1.evil.example:8090", ""):
            handler.headers = {"Host": host}
            self.assertFalse(handler.local_request())
        for host in ("127.0.0.1:8090", "localhost:8090", "[::1]:8090"):
            handler.headers = {"Host": host}
            self.assertTrue(handler.local_request())

    def test_api_credentials_removed_without_changing_auth_home(self):
        with patch.dict(os.environ, {"OPENAI_API_KEY": "secret", "OPENAI_BASE_URL": "https://else.invalid", "CODEX_API_KEY": "other", "CODEX_HOME": "/official/auth", "PATH": "/bin"}, clear=True):
            env = bridge.clean_env()
            self.assertNotIn("OPENAI_API_KEY", env)
            self.assertNotIn("CODEX_API_KEY", env)
            self.assertNotIn("OPENAI_BASE_URL", env)
            self.assertEqual(env["CODEX_HOME"], "/official/auth")

    def test_api_login_never_runs_inference_or_fallback(self):
        with patch.object(bridge, "invoke", return_value=(0, "", "Logged in using an API key")) as process, patch("urllib.request.urlopen") as network:
            with self.assertRaises(engine.ModelError):
                engine.generate("subway", [{"text": "안녕하세요"}])
            self.assertEqual(process.call_count, 1)
            network.assert_not_called()

    def test_missing_cli_and_old_cli(self):
        with patch.object(bridge, "command", side_effect=bridge.BridgeError("없음")):
            self.assertEqual(bridge.inspect()["code"], "unavailable")
        with patch.object(bridge, "invoke", side_effect=[(0, "ChatGPT", ""), (0, "old help", "")]):
            self.assertEqual(bridge.inspect()["code"], "upgrade_required")

    def test_complete_turn_uses_stdin_readonly_and_ephemeral(self):
        with patch.object(bridge, "invoke", side_effect=ready_invocation) as call:
            result = engine.generate("subway", [{"text": "안녕; rm -rf /"}])
        self.assertEqual(result[0]["text"], "아, 괜찮아요.")
        args, kwargs = call.call_args
        command = args[0]
        self.assertNotIn("안녕; rm -rf /", str(command))
        self.assertIn("안녕; rm -rf /", kwargs["input_text"])
        self.assertIn("--ephemeral", command)
        self.assertIn("--ignore-user-config", command)
        self.assertIn("read-only", command)
        self.assertIn('forced_login_method="chatgpt"', command)
        self.assertIn("features.shell_tool=false", command)
        self.assertNotIn("--dangerously-bypass-approvals-and-sandbox", command)

    def test_limit_error_no_retries(self):
        def calls(args, **kw):
            if args[-1] == "-":
                return 1, '{"type":"turn.failed","error":{"message":"usage limit reached"}}', ""
            return ready_invocation(args, **kw)
        with patch.object(bridge, "invoke", side_effect=calls) as process:
            with self.assertRaisesRegex(bridge.BridgeError, "한도"):
                bridge.generate([])
            self.assertEqual(process.call_count, 3)

    def test_tool_events_or_incomplete_results_are_rejected(self):
        for output in ('{"type":"item.started","item":{"type":"command_execution"}}', '{"type":"item.completed","item":{"type":"agent_message","text":"{}"}}'):
            def calls(args, **kw):
                return (0, output, "") if args[-1] == "-" else ready_invocation(args, **kw)
            with self.subTest(output=output), patch.object(bridge, "invoke", side_effect=calls), self.assertRaises(bridge.BridgeError):
                bridge.generate([])

    def test_global_serialization(self):
        bridge.GATE.acquire()
        try:
            with self.assertRaisesRegex(bridge.BridgeError, "진행 중"):
                bridge.generate([])
        finally:
            bridge.GATE.release()

    def test_real_subprocess_protocol_with_fake_cli(self):
        # Actual OS process and stdin/stdout, but no real model or account use.
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "fake cli.py"
            path.write_text('''import json, sys
if sys.argv[-2:] == ["login", "status"]:
 print("Logged in using ChatGPT")
elif sys.argv[-2:] == ["exec", "--help"]:
 print("--ignore-user-config --ignore-rules --ephemeral --output-schema --json")
else:
 text=sys.stdin.read()
 assert "말해도 돼요?" in text
 assert "--sandbox" in sys.argv and "read-only" in sys.argv
 answer=json.dumps({"panels":[{"kind":"speech","text":"네, 말씀하세요."}]},ensure_ascii=False)
 print(json.dumps({"type":"item.completed","item":{"type":"agent_message","text":answer}},ensure_ascii=False))
 print('{"type":"turn.completed"}')
''', encoding="utf-8")
            with patch.object(bridge, "command", return_value=[sys.executable, str(path)]):
                result = engine.generate("subway", [{"text": "말해도 돼요?"}])
                self.assertEqual(result[0]["text"], "네, 말씀하세요.")

    def test_timeout_kills_process(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(bridge.BridgeError, "대기 시간"):
                bridge.invoke([sys.executable, "-c", "import time; time.sleep(10)"], cwd=directory, timeout=0.1)

    def test_bridge_failure_does_not_write_session(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(server, "DB", Path(directory) / "test.db"), patch.object(bridge, "invoke", return_value=(1, "", "Not logged in")):
            sid = server.new_session("subway")
            self.assertEqual(server.take_turn(sid, "안녕하세요", "request-1", 0)[0], 503)
            self.assertEqual(server.read_state(sid)["turns"], [])


if __name__ == "__main__":
    unittest.main()
