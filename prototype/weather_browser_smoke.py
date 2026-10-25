"""Forecast, weather presentation, real umbrella loan, wet activity and severe-weather controls."""
from playwright.sync_api import sync_playwright
import os
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
    for path in ['/prototype/','/demo/campus-demo.html']:
        page=browser.new_page(viewport={'width':390,'height':844})
        errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(base+path)
        assert page.locator('body').get_attribute('data-weather')=='sunny'
        page.locator('[data-action="openWeather"]').click()
        assert '2일차' in page.locator('.page').inner_text() and '오후 ☂ 비' in page.locator('.page').inner_text()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        page.get_by_role('button',name='학생회관 들어가기',exact=True).click()
        page.locator('[data-action="openWeather"]').click()
        page.get_by_role('button',name='공용 우산 빌리기',exact=True).click()
        assert '아이템 획득' in page.locator('.discovery-notice').inner_text()
        assert '대여 우산' in page.locator('.discovery-notice .item-text').inner_text()
        page.get_by_role('button',name='확인',exact=True).click()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        # Checking weather did not silently pass the pending encounter.
        assert page.locator('[data-action="encounter"][data-value="engage"]').is_visible()
        page.get_by_role('button',name='하던 일을 계속하며 지나간다.').click()
        page.get_by_role('button',name='오후 활동 고르기',exact=True).click()
        page.get_by_role('button',name='합주 2시간',exact=True).click()
        page.get_by_role('button',name='이 활동 진행',exact=True).click()
        page.get_by_role('button',name='하루 마무리하기',exact=True).click()
        page.get_by_role('button',name='2일차 시작하기',exact=True).click()
        assert page.locator('body').get_attribute('data-weather')=='rain'
        page.get_by_role('button',name='학생회관 들어가기',exact=True).click()
        page.get_by_role('button',name='하던 일을 계속하며 지나간다.').click()
        page.get_by_role('button',name='오후 활동 고르기',exact=True).click()
        assert '실내 체력 훈련으로 대체' in page.locator('[data-action="select"][data-value="football"]').inner_text()
        assert '우산 준비' in page.locator('[data-action="select"][data-value="walk"]').inner_text()
        page.get_by_role('button',name='축구 동아리 체험 훈련 90분',exact=True).click()
        page.get_by_role('button',name='이 활동 진행',exact=True).click()
        assert '실내 기본 체력' in page.locator('.lead').inner_text()
        page.get_by_role('button',name='캠퍼스로 돌아가기',exact=True).click()
        page.get_by_role('button',name='메뉴',exact=True).click()
        page.get_by_role('button',name='저장',exact=True).first.click()
        saved=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))")
        assert saved['weather']['days']['2']['afternoon']=='rain'
        assert saved['inventory'][0]['id']=='umbrella'
        page.get_by_role('button',name='서먹한 사이',exact=True).click()
        page.get_by_role('button',name='하던 일을 계속하며 지나간다.').click()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        page.get_by_role('button',name='메뉴',exact=True).click()
        page.get_by_role('button',name='강한 비 예시',exact=True).click()
        page.get_by_role('button',name='← 뒤로',exact=True).click()
        assert page.locator('body').get_attribute('data-weather')=='storm'
        if path=='/prototype/':page.screenshot(path='/tmp/campus-weather-storm.png',full_page=True)
        page.get_by_role('button',name='오후 활동 고르기',exact=True).click()
        assert page.locator('[data-action="select"][data-value="explore"]').is_disabled()
        assert page.locator('[data-action="select"][data-value="rehearsal"]').is_enabled()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert not errors,errors
        page.close()
    browser.close()
print('Weather browser smoke passed: module and standalone')
