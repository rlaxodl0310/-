"""Check sustained character conversations reached through incidental encounters."""
from flow_browser_helpers import open_map, visit_place, open_schedule, choose_activity, open_bulletin, end_day, go_campus
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium')
    for path in ['/prototype/', '/demo/campus-demo.html']:
        page = browser.new_page(viewport={'width': 1440, 'height': 1000})
        page.set_default_timeout(7000)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto('http://127.0.0.1:8000' + path)
        for selector in ['.explore', '.portrait']:
            assert page.locator(selector).evaluate('''async element => {
                const match = getComputedStyle(element).backgroundImage.match(/url\\("?([^"\\)]+)"?\\)/);
                if (!match) return false;
                const image = new Image(); image.src = match[1];
                try { await image.decode(); return image.naturalWidth > 0; }
                catch { return false; }
            }''')
        visit_place(page, 'hall')
        page.get_by_role('button', name='하던 일을 계속하며 지나간다.').click()
        page.get_by_role('button', name='창가 쪽 빈자리를 찾아본다').click()
        page.locator('[data-action="encounter"][data-value="engage"]').click()
        page.get_by_role('button', name='사람들 있는 쪽. 저 사람 웃는 거 보니까 분위기가 보여서.').click()
        assert '빈 의자' in page.locator('blockquote').inner_text()
        page.get_by_role('button', name='왜 의자 쪽이 좋아요? 그게 궁금한데.').click()
        page.get_by_role('button', name='자기가 찍은 사진인데 개인적이어도 되죠. 나도 곡에 내 얘기 쓰는데.').click()
        page.get_by_role('button', name='그럴듯하게 말했는데 실제로는 메모만 엄청 쌓여요.').click()
        distant = page.locator('blockquote').inner_text()
        page.get_by_role('button', name='그럼 이따 봐요.').click()
        page.get_by_role('button', name='← 뒤로').click()
        page.get_by_role('button', name='메뉴', exact=True).click()
        page.get_by_role('button', name='호감이 쌓인 사이').click()
        page.get_by_role('button', name='하던 일을 계속하며 지나간다.').click()
        page.get_by_role('button', name='창가 쪽 빈자리를 찾아본다').click()
        page.locator('[data-action="encounter"][data-value="engage"]').click()
        page.get_by_role('button', name='빈 의자 쪽. 다 끝났는데 누가 방금까지 있었던 것 같아요.').click()
        page.get_by_role('button', name='영화도 끝나고 아무도 없는 장면을 남겨두잖아요. 그런 느낌.').click()
        page.get_by_role('button', name='그럴듯하게 말했는데 실제로는 메모만 엄청 쌓여요.').click()
        assert page.locator('blockquote').inner_text() != distant
        page.get_by_role('button', name='그럼 이따 봐요.').click()
        page.get_by_role('button', name='휴게공간을 지나간다').click()
        assert '이쪽을 보지 못한 채' in page.locator('.lead').inner_text()
        page.locator('[data-action="encounter"][data-value="engage"]').click()
        for _ in range(3):
            page.get_by_role('button', name='다음 대화').click()
        page.get_by_role('button', name='서연 씨가 먼저 골라주면 빠르겠네.').click()
        assert '내가 말할게' in page.locator('blockquote').inner_text()
        page.get_by_role('button', name='다음 대화').click()
        page.get_by_role('button', name='대화 마치기', exact=True).click()
        page.get_by_role('button', name='게시판 쪽으로 걸어간다').click()
        page.locator('[data-action="encounter"][data-value="engage"]').click()
        page.get_by_role('button', name='다른 이야기로 넘어가기').click()
        page.get_by_role('button', name='오늘 봉사 활동에 갈게요.').click()
        choose_activity(page, 'rehearsal')
        assert page.get_by_text('봉사 참석 약속을 지키지 못하게 됩니다.', exact=False).is_visible()
        page.get_by_role('button', name='이 활동 진행').click()
        page.get_by_role('button', name='정리 중인 학생회관 쪽으로 돌아간다.').click()
        page.get_by_role('button', name='하던 일을 계속하며 지나간다.').click()
        page.get_by_role('button', name='게시판 쪽으로 걸어간다').click()
        page.locator('[data-action="encounter"][data-value="engage"]').click()
        assert '연락' in page.locator('blockquote').inner_text()
        assert page.get_by_role('button', name='기다리게 한 건 내 잘못이에요. 먼저 말했어야 했는데.').is_visible()
        assert not errors, errors
        print(path + ': incidental access to sustained topics, intimacy, NPC-to-NPC conversation and promise consequences passed.')
        page.close()
    browser.close()
