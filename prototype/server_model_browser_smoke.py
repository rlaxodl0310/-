"""Full browser -> game host -> fake self-hosted inference HTTP -> saved NPC reply.
This verifies integration, not real model quality or inference performance.
"""
import json
import os
import threading
import time
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from unittest.mock import patch
from playwright.sync_api import sync_playwright
from server import GameHandler
from vn_browser_helpers import choose,open_tool,read_to_choices

class Model(BaseHTTPRequestHandler):
 mode='ok'
 calls=[]
 def log_message(self,*args):pass
 def do_POST(self):
  data=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
  Model.calls.append(data)
  if Model.mode=='slow':time.sleep(2)
  if Model.mode=='bad':self.send_error(503);return
  body=json.dumps({'message':{'content':'선배도 자기 일 있는데 제가 너무 붙잡았네요. 오늘은 여기까지만 같이 봐요.'}}).encode()
  self.send_response(200);self.send_header('Content-Length',str(len(body)));self.end_headers()
  try:self.wfile.write(body)
  except (BrokenPipeError,ConnectionResetError):pass
class QuietGame(GameHandler):
 def log_message(self,*args):pass
model=ThreadingHTTPServer(('127.0.0.1',0),Model)
game=ThreadingHTTPServer(('127.0.0.1',0),QuietGame)
threads=[threading.Thread(target=x.serve_forever,daemon=True) for x in [model,game]]
for thread in threads:thread.start()
def fixture(page,base,path,profile='friend'):
 page.goto(base+path)
 page.evaluate('''async profile=>{
  const {newGame,save}=await import('/prototype/simulation.js');
  const s=newGame(profile);s.clock.minute=820;
  localStorage.setItem('campus.slot.1',save(s));
 }''',profile)
 page.locator('.vn-toolbar [data-action="openQuick"]').click()
 page.locator('[data-action="quickTab"][data-value="save"]').click()
 page.locator('[data-action="load"][data-value="1"]').click()
 page.locator('[data-action="quickTab"][data-value="tools"]').click()
 page.locator('[data-action="closeQuick"]').click()
 open_tool(page,'travel');page.locator('[data-action="visit"][data-value="hall"]').click()
def save_state(page):
 page.locator('.vn-toolbar [data-action="openQuick"]').click()
 page.locator('[data-action="quickTab"][data-value="save"]').click()
 page.locator('[data-action="save"][data-value="2"]').click()
 return page.evaluate("JSON.parse(localStorage.getItem('campus.slot.2'))")
try:
 with patch.dict(os.environ,{'CAMPUS_MODEL':'test-local-model','CAMPUS_MODEL_PROVIDER':'ollama','CAMPUS_MODEL_URL':f'http://127.0.0.1:{model.server_port}/api/chat'}):
  base=f'http://127.0.0.1:{game.server_port}'
  with sync_playwright() as p:
   browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
   for path in ['/prototype/','/demo/campus-demo.html']:
    for mode in ['ok','bad','slow','intro']:
     Model.mode=mode;page=browser.new_page(viewport={'width':390,'height':844});page.set_default_timeout(7000);errors=[]
     page.on('pageerror',lambda e:errors.append(str(e)))
     fixture(page,base,path,'acquaintance' if mode=='intro' else 'friend');before=len(Model.calls)
     choose(page,'encounter','engage')
     if mode=='slow':
      page.locator('[data-action="skipModel"]').wait_for()
      page.keyboard.press('Space')
      assert page.locator('[data-action="skipModel"]').is_visible()
      page.locator('[data-action="skipModel"]').click()
     page.locator('[data-action="skipModel"]').wait_for(state='detached')
     read_to_choices(page)
     assert page.locator('.vn-choices button').count()<=3
     data=save_state(page);response=data['dialogue']['sessions']['1:afternoon:yeogyeong']['response']
     if mode in ['ok','intro']:
      assert response['source']=='server-model'
      assert '붙잡았네요' in response['text']
      if mode=='intro':
       assert response['text'].startswith('저는 차여경이에요.')
       assert '선배' not in response['text']
     else:assert response.get('source')!='server-model'
     assert data['clock']['minute']==820
     assert len(Model.calls)==before+1
     assert not errors,errors
     page.close()
   browser.close()
finally:
 for host in [model,game]:host.shutdown();host.server_close()
 for thread in threads:thread.join()
print('Self-hosted dialogue browser integration passed: both builds, model text, failure fallback and skip')
