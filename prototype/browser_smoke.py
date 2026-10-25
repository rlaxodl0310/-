"""Smoke the action-first campus flow, saved slots and unseen information."""
from flow_browser_helpers import open_map, visit_place, open_schedule, choose_activity, open_bulletin, end_day, go_campus
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium')
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    page.set_default_timeout(7000)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto('http://127.0.0.1:8000/')
    page.wait_for_url('**/prototype/')
    visit_place(page, 'hall')
    assert '영수증' in page.locator('.lead').inner_text()
    assert page.locator('[data-action="talk"]').count() == 0
    page.locator('[data-action="encounter"][data-value="engage"]').click()
    assert '휴대폰' in page.locator('blockquote').inner_text()
    choose_activity(page, 'volunteer')
    page.get_by_role('button', name='아직 시작하지 않고 돌아간다.', exact=True).click()
    page.locator('[data-routine="rehearsal"] [data-action="select"]').click()
    page.get_by_role('button', name='이 활동 진행').click()
    page.get_by_role('button', name='건물 밖으로 나와 주변을 둘러본다.').click()
    page.get_by_role('button', name='휴대폰', exact=True).click()
    page.get_by_role('button', name='메시지', exact=True).click()
    assert '포장 누락' not in page.locator('body').inner_text()
    page.get_by_role('button', name='← 뒤로').click()
    page.get_by_role('button', name='← 뒤로').click()
    page.get_by_role('button', name='메뉴', exact=True).click()
    page.locator('[data-action="save"][data-value="1"]').click()
    page.get_by_role('button', name='새 하루 시작').click()
    page.get_by_role('button', name='새로 시작', exact=True).click()
    page.get_by_role('button', name='메뉴', exact=True).click()
    page.locator('[data-action="load"][data-value="1"]').click()
    assert '김태이 · 1일차' in page.locator('.page').inner_text() and '저녁' in page.locator('.page').inner_text()
    assert not errors, errors
    print('Browser smoke passed: incidental exchange, activity cancellation, unseen information and save/load.')
    browser.close()
