"""Sharing a real observation changes an NPC plan; duties override affection; escorts really participate."""
from playwright.sync_api import sync_playwright
import os
base=os.environ.get('CAMPUS_TEST_URL','http://127.0.0.1:8000')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium')
    for path in ['/prototype/','/demo/campus-demo.html']:
        page=browser.new_page(viewport={'width':390,'height':844})
        errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(base+path)
        page.get_by_role('button',name='메뉴',exact=True).click()
        page.get_by_role('button',name='호감이 쌓인 사이',exact=True).click()
        page.get_by_role('button',name='하던 일을 계속하며 지나간다.').click()
        for day,activity in [(1,'합주 2시간'),(2,'개인 음악 작업 2시간')]:
            if day==2:
                page.get_by_role('button',name='학생회관 들어가기',exact=True).click()
                page.get_by_role('button',name='하던 일을 계속하며 지나간다.').click()
            page.get_by_role('button',name='오후 활동 고르기',exact=True).click()
            page.get_by_role('button',name=activity,exact=True).click()
            page.get_by_role('button',name='이 활동 진행',exact=True).click()
            page.get_by_role('button',name='하루 마무리하기',exact=True).click()
            page.get_by_role('button',name=f'{day+1}일차 시작하기',exact=True).click()
        page.get_by_role('button',name='학생회관 들어가기',exact=True).click()
        page.locator('[data-action="encounter"][data-value="engage"]').click()
        page.get_by_role('button',name='← 대화 마치기',exact=True).click()
        page.get_by_role('button',name='뒤편 출입문 쪽으로 걸어간다',exact=True).click()
        page.locator('[data-action="warningChoice"][data-value="inspect"]').click()
        # Re-enter the unfinished Yeogyeong conversation through the actual table area.
        page.get_by_role('button',name='공용 테이블 쪽으로 돌아간다',exact=True).click()
        page.locator('[data-action="encounter"][data-value="engage"]').click()
        page.get_by_role('button',name='안내 확인에 동행 제안하기',exact=True).click()
        assert '물품과 참석 인원' in page.locator('blockquote').inner_text()
        page.get_by_role('button',name='← 대화 마치기',exact=True).click()
        page.get_by_role('button',name='게시판 쪽으로 걸어간다',exact=True).click()
        page.locator('[data-action="encounter"][data-value="engage"]').click()
        page.get_by_role('button',name='주변에서 접한 일 이야기하기',exact=True).click()
        page.locator('[data-action="shareWarning"][data-value="sidegate-detail:현장 안내문"]').click()
        assert page.locator('[data-action="requestEscort"]').is_visible()
        page.get_by_role('button',name='안내 확인에 동행 제안하기',exact=True).click()
        assert '같이 안내부터 확인해봐요' in page.locator('blockquote').inner_text()
        if path=='/prototype/':page.screenshot(path='/tmp/campus-risk-escort.png',full_page=True)
        page.get_by_role('button',name='활동 살펴보기',exact=True).click()
        page.get_by_role('button',name='교내 안내 확인 90분',exact=True).click()
        page.get_by_role('button',name='이 활동 진행',exact=True).click()
        assert '한서연과 함께 안내를 확인' in page.locator('.lead').inner_text()
        page.get_by_role('button',name='캠퍼스로 돌아가기',exact=True).click()
        page.get_by_role('button',name='메뉴',exact=True).click()
        page.get_by_role('button',name='저장',exact=True).first.click()
        saved=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.1'))")
        assert saved['risk']['requests']['yeogyeong']['willing'] is False
        assert next(a for a in saved['appointments'] if a['id']=='risk-escort:seoyeon')['status']=='kept'
        assert any(f['source']=='taei' and f['kind']=='report' for f in saved['risk']['knowledge']['seoyeon'])
        assert any(f['source']=='self' and f['topic']=='library' for f in saved['risk']['knowledge']['seoyeon'])
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert not errors,errors
        page.close()
    browser.close()
print('NPC risk-decision browser smoke passed: module and standalone')
