import importlib.util
import json
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch
import urllib.request
import urllib.error

spec=importlib.util.spec_from_file_location('game_server',Path(__file__).resolve().parents[1]/'server.py')
server=importlib.util.module_from_spec(spec);spec.loader.exec_module(server)

class AIIntegrationTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.db=patch.object(server,'DB',Path(self.tmp.name)/'test.db');self.db.start()
  with server.connect() as db:db.execute('INSERT INTO sessions VALUES(?)',('session',))
  self.request={'scene':'yeogyeong_notebook','node':'ask','text':'여기 필기한 거 봐. 이 부분이야.','request_id':'request-0001'}
 def tearDown(self):self.db.stop();self.tmp.cleanup()
 def test_success_duplicate_and_conflict(self):
  with patch.object(server.bridge,'generate',return_value='{"panels":[{"kind":"speech","text":"아, 여기구나. 잠깐만 적을게."}]}') as generate:
   code,result=server.take_turn('session',self.request);self.assertEqual(code,200)
   code,again=server.take_turn('session',self.request);self.assertEqual(code,200);self.assertTrue(again['cached']);self.assertEqual(generate.call_count,1)
   code,_=server.take_turn('session',{**self.request,'text':'다른 입력'});self.assertEqual(code,409)
   prompt=generate.call_args.args[0];self.assertIn('차여경',prompt[0]['content']);self.assertNotIn('신격',str(prompt))
 def test_failure_keeps_history_empty_and_invalid_scene_never_calls_model(self):
  with patch.object(server.bridge,'generate',side_effect=server.bridge.BridgeError('한도 초과')):
   self.assertEqual(server.take_turn('session',self.request)[0],503)
  with server.connect() as db:self.assertEqual(db.execute('SELECT COUNT(*) FROM turns').fetchone()[0],0)
  with patch.object(server.bridge,'generate') as generate:
   self.assertEqual(server.take_turn('session',{**self.request,'scene':'invented'})[0],400);generate.assert_not_called()
 def test_context_only_contains_same_scene_history(self):
  reply='{"panels":[{"kind":"speech","text":"응."}]}'
  with patch.object(server.bridge,'generate',return_value=reply) as generate:
   server.take_turn('session',self.request)
   server.take_turn('session',{'scene':'woojin_rest_solo','node':'sit','text':'잠깐 쉬세요.','request_id':'request-0002'})
   self.assertNotIn(self.request['text'],str(generate.call_args.args[0]))
 def test_rejects_bad_model_output(self):
  for response in ['not json','{"panels":[]}','{"panels":[{"kind":"action","text":"침묵"}]}']:
   with self.assertRaises(server.bridge.BridgeError):server.parse(response)
 def test_http_health_assets_and_cross_site_guard(self):
  http=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler);thread=threading.Thread(target=http.serve_forever,daemon=True);thread.start();base='http://127.0.0.1:'+str(http.server_port)
  try:
   with patch.object(server.bridge,'connection_status',return_value={'ready':True,'message':'test'}):
    with urllib.request.urlopen(base+'/api/health') as response:self.assertTrue(json.load(response)['ready']);self.assertIn('HttpOnly',response.headers['Set-Cookie'])
   with urllib.request.urlopen(base+'/ai.js') as response:self.assertEqual(response.status,200)
   for path in ['/server.py','/runtime/codex_bridge.py','/.git/config']:
    with self.assertRaises(urllib.error.HTTPError):urllib.request.urlopen(base+path)
   request=urllib.request.Request(base+'/api/chat',data=json.dumps(self.request).encode(),headers={'Content-Type':'application/json','Origin':'https://other.example'})
   with self.assertRaises(urllib.error.HTTPError) as error:urllib.request.urlopen(request)
   self.assertEqual(error.exception.code,403)
  finally:http.shutdown();http.server_close();thread.join()

if __name__=='__main__':unittest.main()
