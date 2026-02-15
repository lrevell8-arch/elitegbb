@echo off
REM Create Coach Account Script for Windows CMD
REM Usage: create-coach.bat <email> <password> <name> <school> [title] [state]

if "%~4"=="" (
    echo.
    echo ========================================
    echo Elite GBB - Create Coach Account
    echo ========================================
    echo.
    echo Usage: create-coach.bat ^<email^> ^<password^> ^<name^> ^<school^> [title] [state]
    echo.
    echo Example:
    echo   create-coach.bat coach@university.edu CoachPass123! "John Smith" "State University"
    echo   create-coach.bat coach@university.edu CoachPass123! "John Smith" "State University" "Head Coach" "CA"
    echo.
    exit /b 1
)

echo.
echo Redirecting to PowerShell script...
powershell -ExecutionPolicy Bypass -File "%~dp0create-coach.ps1" -Email "%~1" -Password "%~2" -Name "%~3" -School "%~4" -Title "%~5" -State "%~6"

if %errorlevel% neq 0 (
    echo.
    echo Coach creation failed.
    pause
    exit /b 1
)

echo.
pause