"""Validate both module and bundled builds against the repository server."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium')
    for path in ['/prototype/', '/demo/campus-demo.html']:
        page = browser.new_page(viewport={'width': 1440, 'height': 1000})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto('http://127.0.0.1:8000' + path)
        assert page.get_by_role('img', name='김태이 정면 초상화').is_visible()
        for selector in ['.explore', '.portrait']:
            loaded = page.locator(selector).evaluate('''async element => {
                const value = getComputedStyle(element).backgroundImage;
                const match = value.match(/url\\("?([^"\\)]+)"?\\)/);
                if (!match) return false;
                const image = new Image();
                image.src = match[1];
                try { await image.decode(); return image.naturalWidth > 0; }
                catch { return false; }
            }''')
            assert loaded, path + ': image missing for ' + selector
        page.get_by_role('button', name='학생회관 들어가기').click()
        page.get_by_role('button', name='박소율 이야기하기').click()
        page.get_by_role('button', name='가벼운 농담으로 어색함을 풀어본다.').click()
        distant = page.locator('blockquote').inner_text()
        page.get_by_role('button', name='이야기를 이어간다').click()
        page.get_by_role('button', name='아까는 내 말이 앞섰어요. 미안해요.').click()
        assert '고마워' in page.locator('blockquote').inner_text()
        page.get_by_role('button', name='← 대화 마치기').click()
        page.get_by_role('button', name='← 뒤로').click()
        page.get_by_role('button', name='메뉴', exact=True).click()
        page.get_by_role('button', name='호감이 쌓인 사이').click()
        page.get_by_role('button', name='박소율 이야기하기').click()
        page.get_by_role('button', name='조금 장난스럽게 말을 건넨다.').click()
        assert page.locator('blockquote').inner_text() != distant
        page.get_by_role('button', name='이야기를 이어간다').click()
        page.get_by_role('button', name='사진 찍는 거 좋아한다며. 요즘 찍은 거 있어?').click()
        page.get_by_role('button', name='이야기를 이어간다').click()
        page.get_by_role('button', name='그때 어떤 기분이었어요?').click()
        assert '타이밍' in page.locator('blockquote').inner_text()
        page.get_by_role('button', name='← 대화 마치기').click()
        page.get_by_role('button', name='서연과 소율의 대화에 다가간다').click()
        for _ in range(3):
            page.get_by_role('button', name='다음 대화').click()
        page.get_by_role('button', name='서연이가 대신 설명해주면 되겠네.').click()
        assert '내가 말할게' in page.locator('blockquote').inner_text()
        page.get_by_role('button', name='다음 대화').click()
        assert '직접 물어봐' in page.locator('blockquote').inner_text()
        page.get_by_role('button', name='대화 마치기', exact=True).click()
        page.get_by_role('button', name='한서연 이야기하기').click()
        page.get_by_role('button', name='오늘 봉사 활동에 갈게요.').click()
        page.get_by_role('button', name='활동 살펴보기').click()
        assert page.get_by_text('봉사 참석을 약속한 상태입니다.', exact=False).is_visible()
        page.get_by_role('button', name='합주 2시간').click()
        assert page.get_by_text('봉사 참석 약속을 지키지 못하게 됩니다.', exact=False).is_visible()
        page.get_by_role('button', name='이 활동 진행').click()
        page.get_by_role('button', name='캠퍼스로 돌아가기').click()
        page.get_by_role('button', name='학생회관 들어가기').click()
        page.get_by_role('button', name='한서연 이야기하기').click()
        assert '연락' in page.locator('blockquote').inner_text()
        if path == '/prototype/':
            page.screenshot(path='/tmp/dialogue-updated.png', full_page=True)
        page.set_viewport_size({'width': 390, 'height': 844})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert not errors, errors
        print(path + ': front portraits, relationship branches, followups, group exchange, broken promise and mobile width passed.')
        page.close()
    browser.close()
