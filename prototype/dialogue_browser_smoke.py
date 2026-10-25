"""Validate character voice, sustained exchanges and packaged image loading."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium')
    for path in ['/prototype/', '/demo/campus-demo.html']:
        page = browser.new_page(viewport={'width': 1440, 'height': 1000})
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
            }'''), path + ': image missing'
        page.get_by_role('button', name='학생회관 들어가기').click()
        page.locator('[data-action="talk"][data-value="soyul"]').click()
        page.get_by_role('button', name='안녕하세요. 혹시 봉사단 분이세요?').click()
        page.get_by_role('button', name='김태이예요. 이번에 복학해서 아직 낯선 얼굴이 많네요.').click()
        page.get_by_role('button', name='사진 고르는 중이에요?').click()
        page.get_by_role('button', name='사람들 있는 쪽. 저 사람 웃는 거 보니까 분위기가 보여서.').click()
        assert '빈 의자' in page.locator('blockquote').inner_text()
        assert page.locator('.player-line').is_visible()
        page.get_by_role('button', name='왜 의자 쪽이 좋아요? 그게 궁금한데.').click()
        page.get_by_role('button', name='자기가 찍은 사진인데 개인적이어도 되죠. 나도 곡에 내 얘기 쓰는데.').click()
        assert '노래 쓸 때' in page.locator('blockquote').inner_text()
        page.get_by_role('button', name='그럴듯하게 말했는데 실제로는 메모만 엄청 쌓여요.').click()
        distant = page.locator('blockquote').inner_text()
        page.get_by_role('button', name='그럼 이따 봐요.').click()
        page.get_by_role('button', name='← 뒤로').click()
        page.get_by_role('button', name='메뉴', exact=True).click()
        page.get_by_role('button', name='호감이 쌓인 사이').click()
        page.get_by_role('button', name='박소율 이야기하기').click()
        # Interested NPC starts asking without waiting for a topic button.
        assert '너는 어느 쪽' in page.locator('blockquote').inner_text()
        page.get_by_role('button', name='빈 의자 쪽. 다 끝났는데 누가 방금까지 있었던 것 같아요.').click()
        page.get_by_role('button', name='영화도 끝나고 아무도 없는 장면을 남겨두잖아요. 그런 느낌.').click()
        page.get_by_role('button', name='그럴듯하게 말했는데 실제로는 메모만 엄청 쌓여요.').click()
        assert page.locator('blockquote').inner_text() != distant
        if path == '/prototype/':
            page.screenshot(path='/tmp/conversation-natural.png', full_page=True)
        page.get_by_role('button', name='그럼 이따 봐요.').click()
        page.get_by_role('button', name='서연과 소율의 대화에 다가간다').click()
        for _ in range(3):
            page.get_by_role('button', name='다음 대화').click()
        page.get_by_role('button', name='서연 씨가 먼저 골라주면 빠르겠네.').click()
        assert '내가 말할게' in page.locator('blockquote').inner_text()
        page.get_by_role('button', name='다음 대화').click()
        assert '본인한테 물어봐' in page.locator('blockquote').inner_text()
        page.get_by_role('button', name='대화 마치기', exact=True).click()
        page.get_by_role('button', name='한서연 이야기하기').click()
        page.get_by_role('button', name='다른 이야기로 넘어가기').click()
        page.get_by_role('button', name='오늘 봉사 활동에 갈게요.').click()
        page.get_by_role('button', name='활동 살펴보기').click()
        page.get_by_role('button', name='합주 2시간').click()
        assert page.get_by_text('봉사 참석 약속을 지키지 못하게 됩니다.', exact=False).is_visible()
        page.get_by_role('button', name='이 활동 진행').click()
        page.get_by_role('button', name='활동 후 사람들 만나기').click()
        page.get_by_role('button', name='한서연 이야기하기').click()
        assert '연락' in page.locator('blockquote').inner_text()
        assert page.get_by_role('button', name='기다리게 한 건 내 잘못이에요. 먼저 말했어야 했는데.').is_visible()
        page.set_viewport_size({'width': 390, 'height': 844})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert not errors, errors
        print(path + ': sustained topic, disagreement, NPC initiative, earned intimacy, group exchange, accountability and image loading passed.')
        page.close()
    browser.close()
