@echo off
echo Fixing XAMPP session permissions...
echo.

REM Stop Apache
echo Stopping Apache...
C:\xampp\apache\bin\httpd.exe -k stop
timeout /t 2 /nobreak >nul

REM Clean old sessions
echo Cleaning old session files...
del /Q C:\xampp\tmp\sess_* 2>nul

REM Set permissions
echo Setting permissions...
icacls "C:\xampp\tmp" /reset /T
icacls "C:\xampp\tmp" /grant:r "Everyone:(OI)(CI)F" /T

REM Start Apache
echo Starting Apache...
C:\xampp\apache\bin\httpd.exe -k start

echo.
echo Done! Please test your application now.
echo.
pause
