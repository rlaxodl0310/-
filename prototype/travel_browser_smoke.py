"""Travel and empty-location exploration must visibly progress in both builds."""
from playwright.sync_api import sync_playwright
import os

base = os.environ.get('CAMPUS_TEST_URL', 'http://127.0.0.1:8000')
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium')
    for path in ['/prototype/', '/demo/campus-demo.html']:
        page = browser.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(base + path)
        page.get_by_role('button', name='다른 장소로 이동').click()
        page.get_by_role('button', name='도서관 찾아가기').click()
        assert '반납기 작동음' in page.get_by_role('status').inner_text()
        page.get_by_role('button', name='반납대와 자료실을 둘러본다').click()
        assert '공용 프린터' in page.get_by_role('status').inner_text()
        page.get_by_role('button', name='다른 장소로 이동').click()
        page.get_by_role('button', name='대학가 카페 찾아가기').click()
        assert '커피 향' in page.get_by_role('status').inner_text()
        page.get_by_role('button', name='주문대 쪽으로 간다').click()
        assert '충전용 콘센트' in page.get_by_role('status').inner_text()
        page.get_by_role('button', name='다른 장소로 이동').click()
        page.get_by_role('button', name='학생회관 찾아가기').click()
        assert '영수증' in page.locator('.lead').inner_text()
        page.locator('[data-action="encounter"][data-value="engage"]').click()
        assert page.locator('blockquote').is_visible()
        assert not errors, errors
        page.close()
    browser.close()
print('Travel browser smoke passed: module and standalone')
