"""Check all Chaewon art variants decode in the real gallery, including offline assets."""
import http.server,threading
from playwright.sync_api import sync_playwright
from vn_browser_helpers import confirm_returning_plan,open_tool
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start()
def decoded(n):
 return n.evaluate("async n=>{const im=new Image();im.src=getComputedStyle(n).backgroundImage.slice(5,-2);await im.decode();return [im.naturalWidth,im.naturalHeight];}")
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
  for path in ['/prototype/','/demo/campus-demo.html']:
   for width,height in [(390,844),(1440,1000)]:
    p=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');p.set_default_timeout(15000);p.set_default_navigation_timeout(60000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
    p.goto(f'http://127.0.0.1:{server.server_port}'+path);confirm_returning_plan(p);open_tool(p,'characterArt');assert p.locator('.gym-student-concept h2').inner_text()=='유채원'
    for art in p.locator('.gym-student-art').all():assert decoded(art)==[1536,1024]
    for cg in ['breeze','training','drinks']:
     p.locator(f'[data-action="chaewonCg"][data-value="{cg}"]').click();art=p.locator('.chaewon-cg');assert art.get_attribute('data-cg')==cg;assert decoded(art)==[1536,1024];box=art.bounding_box();assert abs(box['width']/box['height']-1.5)<.01;assert p.locator(f'[data-action="chaewonCg"][data-value="{cg}"]').get_attribute('aria-pressed')=='true'
    for outfit in ['everyday','training']:
     p.locator(f'[data-action="chaewonSdOutfit"][data-value="{outfit}"]').click()
     for mood in ['neutral','happy','guarded']:
      p.locator(f'[data-action="chaewonSdMood"][data-value="{mood}"]').click();art=p.locator('.chaewon-sd');assert art.get_attribute('data-outfit')==outfit;assert art.get_attribute('data-mood')==mood;assert decoded(art)==[1536,1024]
    assert p.locator('.chaewon-sd').evaluate("async n=>{const im=new Image();im.src=getComputedStyle(n).backgroundImage.slice(5,-2);await im.decode();const c=document.createElement('canvas');c.width=1536;c.height=1024;const x=c.getContext('2d');x.drawImage(im,0,0);for(let row=0;row<2;row++)for(let col=0;col<3;col++){const d=x.getImageData(col*512,row*512,512,512).data;let clear=0,solid=0;for(let i=3;i<d.length;i+=4){if(d[i]===0)clear++;if(d[i]>=240)solid++;}if(clear/262144<.5||solid/262144<.15)return false;}return true;}")
    assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors;p.locator('.chaewon-gallery').screenshot(path=f'/workspace/work/chaewon-gallery-{width}.png');p.close();print(path,width,'passed',flush=True)
  browser.close()
finally:server.shutdown();server.server_close()
print('Chaewon gallery passed: 3 complete CGs, 6 SD variants with clear background and solid figures, corrected outfits, no overflow; web/offline mobile/desktop')
