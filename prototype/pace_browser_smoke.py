"""A conversation's individual choices stay in one period; a batch advances after exit."""
from playwright.sync_api import sync_playwright
import os
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
    for path in ['/prototype/','/demo/campus-demo.html']:
        page=browser.new_page(viewport={'width':390,'height':844})
        page.set_default_timeout(7000)
        errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(base+path)
        page.get_by_role('button',name='메뉴',exact=True).click()
        page.get_by_role('button',name='호감이 쌓인 사이',exact=True).click()
        page.get_by_role('button',name='하던 일을 계속하며 지나간다.').click()
        page.get_by_role('button',name='창가 쪽 빈자리를 찾아본다').click()
        page.locator('[data-action="encounter"][data-value="engage"]').click()
        for choice in ['빈 의자 쪽. 다 끝났는데 누가 방금까지 있었던 것 같아요.','영화도 끝나고 아무도 없는 장면을 남겨두잖아요. 그런 느낌.','그럴듯하게 말했는데 실제로는 메모만 엄청 쌓여요.']:
            page.get_by_role('button',name=choice,exact=True).click()
            assert '13:00' in page.locator('.badge').inner_text()
        page.get_by_role('button',name='그럼 이따 봐요.',exact=True).click()
        assert '13:00' in page.locator('.lead').inner_text()
        page.get_by_role('button',name='게시판 쪽으로 걸어간다').click()
        # Third activity opens a scene; don't jump time while it is being read.
        assert '13:00' in page.locator('.muted').first.inner_text()
        page.get_by_role('button',name='하던 일을 계속하며 지나간다.').click()
        assert '13:30' in page.locator('.lead').inner_text()
        assert '30분이 지났다' in page.locator('.time-summary').inner_text()
        page.get_by_role('button',name='게시판 쪽으로 걸어간다').click()
        assert '13:30' in page.locator('.lead').inner_text()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert not errors,errors
        page.close()
    browser.close()
print('Batched pace browser smoke passed: module and standalone')
