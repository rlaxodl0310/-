@echo off
cd /d "%~dp0"
set FANTASY_PROVIDER=codex
set HOST=127.0.0.1
py -3 server.py
pause
