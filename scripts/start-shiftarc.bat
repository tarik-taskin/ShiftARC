@echo off
setlocal

title ShiftARC Local Development

for %%I in ("%~dp0..") do set "PROJECT_ROOT=%%~fI"

if not exist "%PROJECT_ROOT%\scripts\dev.ps1" (
  echo [ShiftARC] Project files could not be found:
  echo %PROJECT_ROOT%
  echo.
  pause
  exit /b 1
)

pushd "%PROJECT_ROOT%"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%PROJECT_ROOT%\scripts\dev.ps1" -Target all
set "EXIT_CODE=%ERRORLEVEL%"
popd

if not "%EXIT_CODE%"=="0" (
  echo.
  echo [ShiftARC] Startup stopped with exit code %EXIT_CODE%.
  pause
)

exit /b %EXIT_CODE%
