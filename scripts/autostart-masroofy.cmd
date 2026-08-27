@echo off
REM يعمل تلقائيًا مع بدء ويندوز — لا تغلق النافذة السوداء إن ظهرت
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
