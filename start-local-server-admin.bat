@echo off
setlocal

set "PORT=5501"
pushd "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 goto start_python

where python >nul 2>nul
if %errorlevel%==0 goto start_python_cmd

echo Python wurde nicht gefunden.
echo Installiere Python oder starte alternativ einen anderen lokalen Webserver.
popd
pause
exit /b 1

:start_python
echo Starte lokalen Server auf http://localhost:%PORT%/anleitungen-admin.html
start "" http://localhost:%PORT%/anleitungen-admin.html
py server.py %PORT%
popd
exit /b %errorlevel%

:start_python_cmd
echo Starte lokalen Server auf http://localhost:%PORT%/anleitungen-admin.html
start "" http://localhost:%PORT%/anleitungen-admin.html
python server.py %PORT%
popd
exit /b %errorlevel%
