@echo off
REM تشغيل يدوي فقط — لا يُضاف تلقائيًا لبدء ويندوز.
REM للاستخدام: انقر اختصار «مصاريفي» على سطح المكتب أو شغّل scripts\open-masareefy.cmd
set ROOT=C:\Users\drmoh\Projects\masareefy
cd /d "%ROOT%"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js غير موجود في PATH
  exit /b 1
)

if not exist "%ROOT%\node_modules" (
  call npm install
)

if not exist "%ROOT%\.next\BUILD_ID" (
  call npm run build
)

start "مصاريفي" /MIN cmd /c "cd /d \"%ROOT%\" && npm run start"
timeout /t 5 /nobreak >nul
start "" "http://localhost:3737/expenses"
