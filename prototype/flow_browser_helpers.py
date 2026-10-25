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
    finish_morning(page)
    if route=='football':
        open_recruitment(page)
        page.locator('[data-action="readPost"][data-value="football-recruit"]').click()
        page.locator('[data-action="select"][data-value="football"]').click()
        return
    place='library' if route in ['explore','review','work'] else 'arts' if route in ['rehearsal','backstage'] else 'hall'
    visit_place(page,place)
    if page.locator('[data-action="encounter"][data-value="pass"]').count():
        page.locator('[data-action="encounter"][data-value="pass"]').click()
    page.locator(f'[data-action="select"][data-value="{route}"]').click()

def open_recruitment(page):
    page.get_by_role('button',name='휴대폰',exact=True).click()
    page.get_by_role('button',name='학내 커뮤니티',exact=True).click()
    page.get_by_role('button',name='모집',exact=True).click()


def end_day(page):
    if not page.locator('[data-action="go"][data-value="dayEnd"]').count():go_campus(page)
    page.locator('[data-action="go"][data-value="dayEnd"]').click()
    if page.locator('[data-action="freeHome"]').count():page.locator('[data-action="freeHome"]').click()

def go_campus(page):
    for _ in range(8):
        if page.locator('.explore').count():return
        back=page.get_by_role('button',name='← 뒤로',exact=True)
        if back.count():back.click()
        else:page.get_by_role('button',name='← 대화 마치기',exact=True).click()
    raise AssertionError('Could not return from records to the campus scene')

def finish_afternoon(page):
    finish_morning(page)
    visit_place(page,'library')
    if page.locator('[data-action="encounter"][data-value="pass"]').count():page.locator('[data-action="encounter"][data-value="pass"]').click()
    for _ in range(12):
        if '저녁' in page.locator('.lead').inner_text():return
        page.get_by_role('button',name='잠시 쉬며 시간을 보낸다',exact=True).click()
    raise AssertionError('Afternoon did not finish')

def finish_morning(page):
    """Attend real classes before running the archived afternoon feature scenarios."""
    attended=0
    for _ in range(3):
        if not page.locator('[data-action="classTravel"]').count() and not page.locator('[data-action="classPrepare"]').count():break
        if page.locator('[data-action="classTravel"]').count():page.locator('[data-action="classTravel"]').first.click()
        page.locator('[data-action="classPrepare"]').first.click()
        page.locator('[data-action="classChoice"]').first.click()
        attended+=1
    if attended:go_campus(page)
    return attended
