"""Validate scheduled choices -> private condition -> incidental scene -> later outcome."""
from flow_browser_helpers import open_map, visit_place, open_schedule, choose_activity, open_recruitment, end_day, go_campus, finish_afternoon
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium')
    for path in ['/prototype/', '/demo/campus-demo.html']:
        page = browser.new_page(viewport={'width': 1440, 'height': 1000})
        page.set_default_timeout(7000)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto('http://127.0.0.1:8000' + path)
        page.get_by_role('button', name='메뉴', exact=True).click()
        page.get_by_role('button', name='친한 동료', exact=True).click()
        page.get_by_role('button', name='하던 일을 계속하며 지나간다.').click()
        choose_activity(page, 'rehearsal')
        page.get_by_role('button', name='이 활동 진행').click()
        end_day(page)
        page.get_by_role('button', name='2일차 시작하기').click()
        visit_place(page, 'hall')
        page.get_by_role('button', name='하던 일을 계속하며 지나간다.').click()
        choose_activity(page, 'review')
        page.get_by_role('button', name='전시에 필요한 수량과 형식부터 맞춘다.').click()
        assert page.get_by_role('button', name='전시에 필요한 수량과 형식부터 맞춘다.').get_attribute('aria-pressed') == 'true'
        if path == '/prototype/':
            page.screenshot(path='/tmp/event-approach.png', full_page=True)
        page.get_by_role('button', name='이 활동 진행').click()
        assert '설명 문구는 각자' in page.locator('.lead').inner_text()
        assert '말하지 못했고' not in page.locator('body').inner_text()
        page.get_by_role('button', name='건물 밖으로 나와 주변을 둘러본다.').click()
        page.get_by_role('button', name='휴대폰', exact=True).click()
        page.get_by_role('button', name='메시지', exact=True).click()
        assert page.get_by_text('전시에 붙일 글을 조금 썼어요.', exact=False).is_visible()
        page.get_by_role('button', name='← 뒤로').click()
        page.get_by_role('button', name='← 뒤로').click()
        end_day(page)
        page.get_by_role('button', name='3일차 시작하기').click()
        open_map(page)
        page.get_by_role('button', name='도서관 찾아가기').click()
        assert '어젯밤 메시지' in page.locator('.lead').inner_text()
        if path == '/prototype/':
            page.screenshot(path='/tmp/event-conditional-encounter.png', full_page=True)
        page.locator('[data-action="encounter"][data-value="engage"]').click()
        page.get_by_role('button', name='내가 저쪽까지 가볼게요. 거기서 읽히는지 보죠.').click()
        page.get_by_role('button', name='그날 잠깐 앉아 있었단 이야기잖아요. 거창한 척하는 글은 아닌데.').click()
        choose_activity(page, 'backstage')
        page.get_by_role('button', name='이 활동 진행').click()
        # The player did not attend the exhibit; learn its changed result from an actual conversation.
        finish_afternoon(page)
        visit_place(page,'hall')
        page.locator('[data-action="encounter"][data-value="engage"]').click()
        page.get_by_role('button', name='다른 이야기로 넘어가기').click()
        page.get_by_role('button', name='오늘은 어땠어요? 아까 좀 바빠 보이던데.').click()
        assert '고른 이유도 써서 같이 배치' in page.locator('blockquote').inner_text()
        assert not page.locator('[data-action="talk"]').count()
        page.set_viewport_size({'width': 390, 'height': 844})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert not errors, errors
        print(path + ': activity approach, private request read, situational followup, meaningful response and unseen exhibition result passed.')
        page.close()
    browser.close()
