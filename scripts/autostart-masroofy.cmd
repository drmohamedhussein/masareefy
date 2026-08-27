@echo off
REM ضع اختصارًا لهذا الملف في مجلد Startup لتشغيل مصروفي مع ويندوز
cd /d "%~dp0.."
if not exist ".next" (
  call npm run build
)
start "مصروفي" cmd /c "npm run start"
timeout /t 3 >nul
start http://localhost:3737/expenses
