"""Static design reference from the native composition values. NOT a Unity screenshot."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import json
import sys
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2]
layout=json.loads(Path(sys.argv[1]).read_text())
class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args):pass
    def copyfile(self,source,outputfile):
        try:super().copyfile(source,outputfile)
        except (BrokenPipeError,ConnectionResetError):pass
server=ThreadingHTTPServer(('127.0.0.1',0),QuietHandler)
Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/unity/CampusSurvival/Assets/Campus/Resources'
def rect(name):
    b=layout[name]
    return f'left:{b["x"]}px;top:{900-b["Top"]}px;width:{b["width"]}px;height:{b["height"]}px;'
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><style>
@font-face{font-family:nanum;src:url('FONT')}*{box-sizing:border-box}body{margin:0;width:1600px;height:900px;overflow:hidden;font-family:nanum;color:#f0ede1;background:#101821}button{font:inherit;color:inherit;border:0;cursor:default}.bg{position:absolute;inset:0;background:url('BG') center/cover}.tint{position:absolute;inset:0;background:rgba(6,9,14,.06)}.sprite{position:absolute;SPRITE;background:url('SPRITES') -750px 0/1500px 2250px no-repeat}.hud{position:absolute;HEADER;background:rgba(6,10,17,.75);border-bottom:1px solid #d9ba8242;padding:8px 18px}.meta{font-size:16px;color:#d9ba82}.place{font-size:19px;margin-top:8px}.nav{position:absolute;right:8px;top:9px;display:flex;gap:8px}.nav button{width:110px;height:42px;background:#161e27;font-size:16px}.choices{position:absolute;CHOICES;display:flex;flex-direction:column;gap:12px}.choices button{position:relative;text-align:left;background:rgba(22,29,38,.96);min-height:66px;padding:0 24px;font-size:21px;line-height:1.4;box-shadow:0 8px 26px #0002}.choices button:before{content:'';position:absolute;left:0;top:14px;bottom:14px;width:2px;background:#d9ba82b0}.choices small{color:#d9ba82;margin-right:20px}.dialogue{position:absolute;DIALOGUE;background:rgba(11,17,24,.97);border-top:1px solid #d9ba82cc}.name{position:absolute;left:24px;top:-16px;width:194px;height:40px;background:#1a2430;color:#d9ba82;display:flex;align-items:center;padding-left:18px;font-size:21px}.copy{position:absolute;left:30px;right:30px;top:48px;font-size:27px;line-height:1.5}.hint{position:absolute;left:30px;bottom:20px;color:#94a6b3;font-size:15px}.quick{position:absolute;right:16px;bottom:8px;display:flex;gap:6px}.quick button{font-size:14px;background:#161e27;width:81px;height:37px}.dim{position:absolute;inset:0;background:rgba(4,6,12,.78)}.phone{position:absolute;left:550px;top:70px;width:500px;height:760px;background:#f2f0e6;color:#243039;border-top:1px solid #737f7c;padding:0 28px}.over{position:absolute;left:28px;top:22px;font-size:13px;letter-spacing:1px;color:#667b75}.phone h1{position:absolute;left:28px;top:52px;margin:0;font-size:32px;font-weight:400}.close{position:absolute;right:18px;top:18px;background:#e3e3d9;width:74px;height:40px;color:#243039}.sub{position:absolute;left:28px;top:103px;font-size:16px;color:#667875}.phone-content{position:absolute;left:28px;right:28px;top:160px}.clock{height:115px;background:#dcded4;padding:14px 22px}.clock strong{display:block;font-size:48px;font-weight:400}.clock small{display:block;margin-top:8px;font-size:16px;color:#5c706d}.apps{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.apps button{text-align:left;padding:22px;height:112px;background:#e3e3d9;color:#243039;font-size:19px;line-height:1.4}.note{font-size:17px;color:#667875;line-height:1.6;margin-top:20px}.watermark{position:absolute;right:25px;bottom:12px;color:#fff7;font:11px sans-serif;letter-spacing:1px}
</style><div class="bg"></div><div class="tint"></div><div class="sprite"></div><div id="story"><div class="hud"><div class="meta">DAY 01   /   13:30   ·   맑음 · 22°C</div><div class="place">자유관 · 202호 봉사단 준비실</div><div class="nav"><button>이동</button><button>휴대폰</button><button>메뉴</button></div></div><div class="choices"><button><small>01</small>그 이야기에서 궁금한 점을 더 묻는다.</button><button><small>02</small>내 경험도 짧게 이야기한다.</button><button><small>03</small>다음에 보자며 인사를 마친다.</button></div><div class="dialogue"><div class="name">차여경</div><div class="copy">이번에는 서로 어디까지 할 수 있는지 먼저 이야기해볼까요?</div><div class="hint">어떻게 할까</div><div class="quick"><button>기록</button><button>AUTO</button><button>UI 숨김</button><button>저장</button></div></div></div><div id="phone" hidden><div class="dim"></div><div class="phone"><div class="over">CAMPUS / MOBILE</div><h1>휴대폰</h1><button class="close">닫기</button><div class="sub">1일차  13:30   ·   맑음 · 22°C</div><div class="phone-content"><div class="clock"><strong>13:30</strong><small>오늘도, 각자의 하루가 흐른다.</small></div><div class="apps"><button>캠퍼스톡 ·<br>학내 커뮤니티</button><button>메시지</button><button>약속 ·<br>제안과 일정</button><button>동아리 ·<br>모집과 신청</button></div><div class="note">메뉴를 읽는 동안에는<br>시간이 지나지 않습니다.</div></div></div></div><div class="watermark">DESIGN REFERENCE · NOT A UNITY CAPTURE</div></html>'''
for key,value in {'FONT':base+'/Korean.ttf','BG':base+'/Art/Campus.png','SPRITES':base+'/Art/StandSprites.png','SPRITE':rect('character'),'HEADER':rect('header'),'CHOICES':rect('choices'),'DIALOGUE':rect('dialogue')}.items():html=html.replace(key,value)
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1600,'height':900},device_scale_factor=1)
        page.set_content(html,wait_until='networkidle');page.evaluate('document.fonts.ready')
        for phone,name in [(False,'vn-quality-layout-preview.png'),(True,'vn-quality-phone-preview.png')]:
            page.evaluate('(phone)=>{document.querySelector("#story").hidden=phone;document.querySelector("#phone").hidden=!phone}',phone)
            page.screenshot(path=str(ROOT/'docs/assets'/name))
            print(name)
        browser.close()
finally:server.shutdown();server.server_close()
