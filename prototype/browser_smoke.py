"""Run with the repository HTTP server on port 8000; requires Python Playwright and Chromium."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium')
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto('http://127.0.0.1:8000/')
    page.wait_for_url('**/prototype/')
    page.get_by_role('button', name='학생회관 들어가기').click()
    page.get_by_role('button', name='한서연 이야기하기').click()
    page.get_by_role('button', name='지금 무슨 일 하고 있었어요?').click()
    page.get_by_role('button', name='활동 살펴보기').click()
    page.get_by_role('button', name='봉사 활동').click()
    page.get_by_role('button', name='취소', exact=True).click()
    page.get_by_role('button', name='합주 2시간').click()
    page.get_by_role('button', name='이 활동 진행').click()
    assert page.get_by_text('합주를 마쳤다.', exact=False).is_visible()
    page.get_by_role('button', name='캠퍼스로 돌아가기').click()
    page.get_by_role('button', name='휴대폰', exact=True).click()
    page.get_by_role('button', name='메시지', exact=True).click()
    assert page.get_by_text('오늘 활동 마쳤습니다.', exact=False).is_visible()
    assert page.get_by_text('포장 누락', exact=False).count() == 0
    page.get_by_role('button', name='← 뒤로').click()
    page.get_by_role('button', name='← 뒤로').click()
    page.get_by_role('button', name='메뉴', exact=True).click()
    page.locator('[data-action="save"][data-value="1"]').click()
    assert page.get_by_role('status').inner_text() == '슬롯 1에 저장했습니다.'
    page.get_by_role('button', name='새 하루 시작').click()
    page.get_by_role('button', name='새로 시작', exact=True).click()
    page.get_by_role('button', name='메뉴', exact=True).click()
    page.locator('[data-action="load"][data-value="1"]').click()
    assert page.get_by_text('김태이 · 저녁', exact=True).is_visible()
    assert not errors, errors
    page.get_by_role('button', name='← 뒤로').click()
    page.screenshot(path='/tmp/campus-prototype.png')
    page.set_viewport_size({'width': 390, 'height': 844})
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    print('Browser smoke passed: dialogue, cancel, activity, information boundaries, save/reset/load, mobile width; no JavaScript errors.')
    browser.close()
