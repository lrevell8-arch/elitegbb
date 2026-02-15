@echo off
REM Coach Activation Script for Windows CMD
REM Usage: activate-coach.bat <coach_email>

if "%~1"=="" (
    echo Usage: activate-coach.bat ^<coach_email^>
    echo Example: activate-coach.bat coach@university.edu
    exit /b 1
)

echo.
echo ========================================
echo Elite GBB Coach Activation Tool
echo ========================================
echo.
echo Coach Email: %1
echo API: https://app.elitegbb.com
echo.
echo This script requires PowerShell. Redirecting...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0activate-coach.ps1" -CoachEmail "%1"

if %errorlevel% neq 0 (
    echo.
    echo Activation failed. See errors above.
    pause
    exit /b 1
)

echo.
pause