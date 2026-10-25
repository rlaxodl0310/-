"""New students are initially unfamiliar, but interaction requires an encountered situation."""
from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium')
    for path in ['/prototype/', '/demo/campus-demo.html']:
        page = browser.new_page(viewport={'width': 1440, 'height': 1000})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto('http://127.0.0.1:8000' + path)
        page.get_by_role('button', name='학생회관 들어가기').click()
        assert '차여경' not in page.locator('.lead').inner_text()
        assert '발치' in page.locator('.lead').inner_text()
        assert not page.get_by_role('button', name='차여경', exact=False).count()
        assert not page.locator('[data-action="talk"]').count()
        if path == '/prototype/':
            page.screenshot(path='/tmp/encounter-hall.png', full_page=True)
        page.get_by_role('button', name='하던 일을 계속하며 지나간다.').click()
        assert page.get_by_role('button', name='게시판 쪽으로 걸어간다').is_visible()
        page.get_by_role('button', name='← 뒤로').click()
        page.get_by_role('button', name='학생회관 들어가기').click()
        assert not page.locator('[data-action="encounter"]').count()
        page.get_by_role('button', name='창가 쪽 빈자리를 찾아본다').click()
        assert '박소율' not in page.locator('.lead').inner_text()
        page.locator('[data-action="encounter"][data-value="engage"]').click()
        assert '저는 박소율' in page.locator('blockquote').inner_text()
        assert '사진' in page.locator('blockquote').inner_text()
        page.get_by_role('button', name='← 대화 마치기').click()
        page.get_by_role('button', name='← 뒤로').click()
        page.get_by_role('button', name='메뉴', exact=True).click()
        page.locator('[data-action="save"][data-value="3"]').click()
        saved = json.loads(page.evaluate('localStorage.getItem("campus.slot.3")'))
        assert saved['contacts']['yeogyeong']['nameLevel'] == 'unknown'
        assert saved['contacts']['yeogyeong']['introduced'] is False
        assert saved['contacts']['soyul']['introduced'] is True
        assert any(e.get('outcome') == 'passed' for e in saved['encounters'].values())
        page.get_by_role('button', name='새 하루 시작').click()
        page.get_by_role('button', name='새로 시작', exact=True).click()
        page.get_by_role('button', name='메뉴', exact=True).click()
        page.locator('[data-action="load"][data-value="3"]').click()
        page.get_by_role('button', name='← 뒤로').click()
        page.get_by_role('button', name='학생회관 들어가기').click()
        assert not page.locator('[data-action="encounter"]').count()
        page.set_viewport_size({'width': 390, 'height': 844})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert not errors, errors
        print(path + ': unknown initial names, no roster, incidental action, optional passing and persisted encounter resolution passed.')
        page.close()
    browser.close()
