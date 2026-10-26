"""Adapter contract tests use a fake inference service, not a real language model."""
import json
import threading
import unittest
from unittest.mock import patch
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from server import GameHandler, request_model, validate_context

CONTEXT = {'character':'차여경', 'name':'차여경', 'history':[], 'playerLine':'지금 괜찮아요?', 'draft':'네.', 'constraints':{'intent':'reflect'}}
class Inference(BaseHTTPRequestHandler):
    def log_message(self, *args): pass
    def do_POST(self):
        self.server.payload=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        text='지금은 조금 천천히 이야기해도 될까요?'
        body=json.dumps({'message':{'content':text}} if 'options' in self.server.payload else {'choices':[{'message':{'content':text}}]}).encode()
        self.send_response(200);self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
class ServerTests(unittest.TestCase):
    def test_context_validation(self):
        self.assertEqual(validate_context({**CONTEXT,'untrusted_extra':'removed'}),CONTEXT)
        for bad in [None,{}, {**CONTEXT,'history':[{}]*7}]:
            with self.assertRaises(ValueError):validate_context(bad)
    def test_real_http_adapter_contract(self):
        inference=ThreadingHTTPServer(('127.0.0.1',0),Inference)
        worker=threading.Thread(target=inference.serve_forever,daemon=True);worker.start()
        try:
            for provider in ['ollama','llamacpp']:
                with self.subTest(provider=provider):
                    text=request_model(CONTEXT,{'provider':provider,'model':'test','endpoint':f'http://127.0.0.1:{inference.server_port}/api/chat'})
                    self.assertIn('천천히',text);self.assertEqual(inference.payload['model'],'test')
                    self.assertFalse(inference.payload['stream']);self.assertEqual(len(inference.payload['messages']),2)
        finally:inference.shutdown();inference.server_close();worker.join()
    def test_api_config_and_static_boundaries(self):
        host=ThreadingHTTPServer(('127.0.0.1',0),GameHandler)
        worker=threading.Thread(target=host.serve_forever,daemon=True);worker.start();base=f'http://127.0.0.1:{host.server_port}'
        try:
            with patch.dict('os.environ',{'CAMPUS_MODEL':''}):
                self.assertFalse(json.load(urlopen(base+'/api/dialogue/status'))['configured'])
                with self.assertRaises(HTTPError) as error:urlopen(Request(base+'/api/dialogue',data=json.dumps({'context':CONTEXT}).encode(),method='POST'))
                self.assertEqual(error.exception.code,503)
            for path in ['/.git/config','/prototype/server.py','/prototype/../AGENTS.md']:
                with self.assertRaises(HTTPError):urlopen(base+path)
            self.assertEqual(urlopen(base+'/prototype/').status,200)
            with self.assertRaises(HTTPError) as error:urlopen(Request(base+'/api/dialogue',data=b'{}',method='POST'))
            self.assertEqual(error.exception.code,400)
        finally:host.shutdown();host.server_close();worker.join()
if __name__=='__main__':unittest.main()
