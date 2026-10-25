"""Offline residents publish over time; post reading, delayed comments and phone context work."""
from playwright.sync_api import sync_playwright
import os,re
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
    for path in ['/prototype/','/demo/campus-demo.html']:
        page=browser.new_page(viewport={'width':390,'height':844})
        page.set_default_timeout(7000)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.clock.install()
        page.goto(base+path)
        before=page.locator('.badge').inner_text()
        page.get_by_role('button',name='휴대폰',exact=True).click()
        page.get_by_role('button',name='학내 커뮤니티',exact=True).click()
        assert page.get_by_role('heading',name='캠퍼스톡',exact=True).is_visible()
        initial=page.locator('.community-post').count()
        for _ in range(24):page.clock.fast_forward(15000)
        assert page.locator('.community-post').count()==initial  # no jumping feed while reading
        assert '새 글' in page.locator('.community-live').inner_text()
        page.locator('[data-action="applyCommunityUpdates"]').click()
        assert page.locator('.community-post').count()>initial
        page.locator('[data-action="readPost"][data-value="football-recruit"]').click()
        page.get_by_role('button',name='이 글의 모집 안내를 자세히 읽는다.',exact=True).click()
        page.get_by_role('button',name='이 동아리에 가입하기',exact=True).click()
        assert '가입 중입니다' in page.locator('.page').inner_text()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        if path=='/prototype/':page.screenshot(path='/tmp/community-feed.png',full_page=True)
        generated=page.locator('[data-action="readPost"][data-value^="student-"]').filter(has_text=re.compile(r'댓글 [1-9]')).first
        generated.click()
        assert '작성자·내용 미확인' in page.locator('.community-detail').inner_text()
        body=page.locator('.community-detail').inner_text()
        for _ in range(10):page.clock.fast_forward(15000)
        assert page.locator('.community-detail').inner_text()==body
        if page.locator('[data-action="applyCommunityUpdates"]').count():page.locator('[data-action="applyCommunityUpdates"]').click()
        assert page.locator('.community-comment').count()>0
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        assert page.locator('.badge').inner_text()==before
        page.get_by_role('button',name='메뉴',exact=True).click()
        page.get_by_role('button',name='저장',exact=True).first.click()
        saved=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))")
        assert len(saved['community']['posts'])>3 and saved['flow']['seen']['club:football']
        assert all(p['kind']=='anonymous' for p in saved['community']['posts'])
        assert saved['warnings']['evidence']==[]
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert not errors,errors
        page.close()
    browser.close()
print('Organic community browser smoke passed: both builds, simulated time')
