@echo off
title JDD Kanban -- Launcher
echo Starting JDD Kanban dev server...
echo.
echo Dev server logs will appear in a separate window.
echo This launcher will close once Chrome opens.
echo.

REM Spawn the dev server in its own visible cmd window so you can see logs.
REM The /k keeps that window open after npm exits (or if it crashes).
start "JDD Kanban dev server" cmd /k "cd /d C:\Users\Xander\Desktop\jdd-kanban && npm run dev"

REM Poll the localhost port range until our app responds, then open Chrome.
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Xander\Desktop\jdd-kanban\scripts\launch-dev.ps1"

REM Self-close the launcher window. The dev server window keeps running.
exit
