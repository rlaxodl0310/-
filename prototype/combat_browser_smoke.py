"""Compatibility entry point for the current tactical combat browser checks."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('combat_grid_browser_smoke.py')),run_name='__main__')
