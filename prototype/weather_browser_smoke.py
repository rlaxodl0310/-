"""Forecast, weather presentation, real umbrella loan, wet activity and severe-weather controls."""
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
        assert page.locator('body').get_attribute('data-weather')=='sunny'
        page.locator('[data-action="openWeather"]').click()
        assert '2일차' in page.locator('.page').inner_text() and '오후 ☂ 비' in page.locator('.page').inner_text()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        visit_place(page, 'hall')
        page.locator('[data-action="openWeather"]').click()
        page.get_by_role('button',name='공용 우산 빌리기',exact=True).click()
        assert '아이템 획득' in page.locator('.discovery-notice').inner_text()
        assert '대여 우산' in page.locator('.discovery-notice .item-text').inner_text()
        page.get_by_role('button',name='확인',exact=True).click()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        # Checking weather did not silently pass the pending encounter.
        assert page.locator('[data-action="encounter"][data-value="engage"]').is_visible()
        page.get_by_role('button',name='하던 일을 계속하며 지나간다.').click()
        open_recruitment(page)
        page.locator('[data-action="readPost"][data-value="football-recruit"]').click()
        choose_activity(page, 'rehearsal')
        page.get_by_role('button',name='이 활동 진행',exact=True).click()
        end_day(page)
        page.get_by_role('button',name='2일차 시작하기',exact=True).click()
        assert page.locator('body').get_attribute('data-weather')=='rain'
        visit_place(page, 'hall')
        page.get_by_role('button',name='하던 일을 계속하며 지나간다.').click()
        open_schedule(page)
        assert '실내 체력 훈련으로 대체' in page.locator('[data-routine="football"]').inner_text()
        assert '우산 준비' in page.locator('[data-routine="walk"]').inner_text()
        page.locator('[data-routine="football"] [data-action="select"]').click()
        page.get_by_role('button',name='이 활동 진행',exact=True).click()
        assert '실내 기본 체력' in page.locator('.lead').inner_text()
        page.get_by_role('button',name='건물 밖으로 나와 주변을 둘러본다.',exact=True).click()
        page.get_by_role('button',name='메뉴',exact=True).click()
        page.get_by_role('button',name='저장',exact=True).first.click()
        saved=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))")
        assert saved['weather']['days']['2']['afternoon']=='rain'
        assert saved['inventory'][0]['id']=='umbrella'
        page.get_by_role('button',name='서먹한 사이',exact=True).click()
        page.get_by_role('button',name='하던 일을 계속하며 지나간다.').click()
        visit_place(page,'library')
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        page.get_by_role('button',name='메뉴',exact=True).click()
        page.get_by_role('button',name='강한 비 예시',exact=True).click()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        assert page.locator('body').get_attribute('data-weather')=='storm'
        if path=='/prototype/':page.screenshot(path='/tmp/campus-weather-storm.png',full_page=True)
        open_schedule(page)
        assert page.locator('[data-action="select"][data-value="explore"]').is_disabled()
        assert page.locator('[data-action="select"][data-value="rehearsal"]').is_enabled()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert not errors,errors
        page.close()
    browser.close()
print('Weather browser smoke passed: module and standalone')
