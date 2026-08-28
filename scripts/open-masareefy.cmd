@echo off
chcp 65001 >nul
title مصاريفي
set ROOT=%~dp0..
cd /d "%ROOT%"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js غير مثبت أو غير موجود في PATH.
  pause
  exit /b 1
)

REM هل السيرفر شغال على 3737؟
powershell -NoProfile -Command ^
  "try { (Invoke-WebRequest -Uri 'http://localhost:3737' -UseBasicParsing -TimeoutSec 2).StatusCode | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
  echo تشغيل مصاريفي على المنفذ 3737...
  start "مصاريفي-سيرفر" /MIN cmd /c "cd /d \"%ROOT%\" && npm run dev"
  echo انتظر بضع ثوانٍ...
  timeout /t 6 /nobreak >nul
) else (
  echo السيرفر يعمل بالفعل.
)

start "" "http://localhost:3737/expenses"
exit /b 0
