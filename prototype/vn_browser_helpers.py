"""Navigate the actual sequential dialogue UI without skipping domain actions."""
def read_to_choices(page):
    for _ in range(32):
        next_button=page.locator('.vn-controls [data-action="vnNext"]')
        if not next_button.count():return
        next_button.click()
    raise AssertionError('Narrative did not reach its choice phase')

def choose(page,action,value=None):
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
    page.locator('.vn-toolbar [data-action="openQuick"]').click()
    page.locator(f'.page-reading .grid [data-action="go"][data-value="{tool}"]').click()

def finish_school_morning(page):
    for _ in range(2):
        choose(page,'classTravel')
        choose(page,'classPrepare')
        choose(page,'classChoice')
