"""Three event types yield sourced clues without declaring an outbreak or replacing daily play."""
from flow_browser_helpers import open_map, visit_place, open_schedule, choose_activity, open_recruitment, end_day, go_campus
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
        page.get_by_role('button',name='친한 동료',exact=True).click()
        page.get_by_role('button',name='하던 일을 계속하며 지나간다.').click()
        for day,activity in [(1,'합주 2시간'),(2,'개인 음악 작업 2시간')]:
            if day==2:
                visit_place(page, 'hall')
                page.get_by_role('button',name='하던 일을 계속하며 지나간다.').click()
            choose_activity(page,'rehearsal' if day==1 else 'work')
            page.get_by_role('button',name='이 활동 진행',exact=True).click()
            end_day(page)
            page.get_by_role('button',name=f'{day+1}일차 시작하기',exact=True).click()
        page.get_by_role('button',name='휴대폰',exact=True).click()
        assert not page.get_by_role('button',name='확인한 일',exact=True).count()
        page.get_by_role('button',name='메시지',exact=True).click()
        assert '지원 인력 일부의 도착이 늦고' in page.locator('.page').inner_text()
        assert '물품 담당자가 아직 안 왔어요' in page.locator('.page').inner_text()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        page.get_by_role('button',name='확인한 일',exact=True).click()
        assert '안내 확인' in page.locator('.page').inner_text() and '전해 들음' in page.locator('.page').inner_text()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        open_map(page)
        page.get_by_role('button',name='대학가 카페 찾아가기',exact=True).click()
        page.get_by_role('button',name='창밖의 정류장 쪽을 살펴본다',exact=True).click()
        assert '구급차' in page.locator('.lead').inner_text()
        page.locator('[data-action="warningChoice"][data-value="inspect"]').click()
        assert '들것' in page.locator('.page > .notice').inner_text()
        open_map(page)
        page.get_by_role('button',name='자유관 찾아가기',exact=True).click()
        page.get_by_role('button',name='하던 일을 계속하며 지나간다.').click()
        page.get_by_role('button',name='뒤편 출입문 쪽으로 걸어간다',exact=True).click()
        page.locator('[data-action="openWeather"]').click()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        assert page.locator('[data-action="warningChoice"][data-value="inspect"]').is_visible()
        if path=='/prototype/':page.screenshot(path='/tmp/campus-warning-gate.png',full_page=True)
        page.locator('[data-action="warningChoice"][data-value="inspect"]').click()
        choose_activity(page, 'checkCampus')
        assert '확인하는 동안 다른 약속과 겹치지 않는지' in page.locator('.lead').inner_text()
        page.get_by_role('button',name='이 활동 진행',exact=True).click()
        assert '같은 원인인지 확인할 근거는 없었다' in page.locator('.lead').inner_text()
        page.get_by_role('button',name='건물 밖으로 나와 주변을 둘러본다.',exact=True).click()
        page.get_by_role('button',name='메뉴',exact=True).click()
        page.get_by_role('button',name='저장',exact=True).first.click()
        saved=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))")
        assert len(saved['warnings']['evidence'])>=7
        assert {e['kind'] for e in saved['events']}=={'scheduled','conditional','situational'}
        assert saved['world']['stage']=='campus'
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert not errors,errors
        page.close()
    browser.close()
print('Campus warning browser smoke passed: module and standalone')
