"""Navigate the actual sequential dialogue UI without skipping domain actions."""
def read_returning_opening(page):
    for _ in range(8):
        button=page.locator('[data-action="openingNext"]')
        if not button.count():return
        button.click()
    raise AssertionError('Opening did not reach registration')

def confirm_returning_plan(page):
    read_returning_opening(page)
    if page.locator('[data-action="courseConfirm"]').count():page.locator('[data-action="courseConfirm"]').click()

def read_to_choices(page):
    confirm_returning_plan(page)
    for _ in range(32):
        next_button=page.locator('.vn-controls [data-action="vnNext"]')
        if not next_button.count():return
        next_button.click()
    raise AssertionError('Narrative did not reach its choice phase')

def choose(page,action,value=None):
    read_to_choices(page)
    if action!='everydayChoice' and page.locator('.vn-choices [data-action="everydayChoice"]').count():
        page.locator('.vn-choices [data-action="everydayChoice"]').first.click()
        read_to_choices(page)
    seen=set()
    for _ in range(24):
        selector=f'.vn-choices [data-action="{action}"]'
        if value is not None:selector+=f'[data-value="{value}"]'
        target=page.locator(selector)
        if target.count():target.first.click();return
        fingerprint=page.locator('.vn-choices').inner_text()
        if fingerprint in seen:break
        seen.add(fingerprint)
        more=page.locator('.vn-choices [data-action="vnCycle"]')
        if not more.count():break
        more.click()
    raise AssertionError(f'Choice not reachable: {action}:{value}')

def open_tool(page,tool):
    confirm_returning_plan(page)
    page.locator('.vn-toolbar [data-action="openQuick"]').click()
    page.locator(f'.page-reading .grid [data-action="go"][data-value="{tool}"]').click()

def finish_school_morning(page):
    for _ in range(2):
        choose(page,'classTravel')
        choose(page,'classPrepare')
        choose(page,'classChoice')


def legacy_survival_fixture(page):
    """Load an old consenting two-person campaign; fresh play now starts solo."""
    import copy
    def press(action,value=None):
        page.locator(f'[data-action="{action}"]'+(f'[data-value="{value}"]' if value is not None else '')).first.click()
    press('openQuick');press('quickTab','save');press('save','3')
    state=page.evaluate("JSON.parse(localStorage.getItem('campus.slot.3'))")
    run=state['survivalRun']
    if len(run['members'])==1:
        companion=copy.deepcopy(run['members'][0]);companion.update({'key':'ally','character':'student','attributes':{'strength':4,'agility':4,'vitality':4,'endurance':4,'mentality':4}});run['members'].append(companion)
    run.pop('parties',None)
    page.evaluate("s=>localStorage.setItem('campus.slot.3',JSON.stringify(s))",state)
    page.reload();page.locator('.opening-tools [data-action="openQuick"]').click();press('load','3');press('quickTab','tools');press('go','survival')
