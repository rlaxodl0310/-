"""Shared navigation for feature regression tests; uses only visible phone and scene controls."""
def open_map(page):
    page.get_by_role('button', name='휴대폰', exact=True).click()
    page.get_by_role('button', name='지도', exact=True).click()
    page.get_by_role('button', name='학교 길 안내를 확인한다.', exact=True).click()

def visit_place(page, place):
    open_map(page)
    page.locator(f'[data-action="visit"][data-value="{place}"]').click()

def open_schedule(page):
    page.get_by_role('button', name='휴대폰', exact=True).click()
    page.get_by_role('button', name='일정', exact=True).click()

def choose_activity(page, route):
    if route=='explore':
        visit_place(page,'library')
        if page.locator('[data-action="encounter"][data-value="pass"]').count():
            page.locator('[data-action="encounter"][data-value="pass"]').click()
    open_schedule(page)
    page.locator(f'[data-routine="{route}"] [data-action="select"]').click()

def open_recruitment(page):
    page.get_by_role('button',name='휴대폰',exact=True).click()
    page.get_by_role('button',name='학내 커뮤니티',exact=True).click()
    page.get_by_role('button',name='모집',exact=True).click()


def end_day(page):
    page.locator('[data-action="go"][data-value="dayEnd"]').click()

def go_campus(page):
    for _ in range(8):
        if page.locator('.explore').count():return
        back=page.get_by_role('button',name='← 뒤로',exact=True)
        if back.count():back.click()
        else:page.get_by_role('button',name='← 대화 마치기',exact=True).click()
    raise AssertionError('Could not return from records to the campus scene')
