@echo off
:: 현재 폴더 위치로 이동 (오류 방지)
cd /d %~dp0

echo ==========================================
echo       Ghostwriter를 실행합니다...
echo       (창을 닫으면 서버가 종료됩니다)
echo ==========================================

:: 1. 백엔드 서버 실행 (새 창)
start "Ghostwriter Backend" cmd /k "cd backend && uvicorn main:app --reload"

:: 2. 프론트엔드 서버 실행 (새 창)
start "Ghostwriter Frontend" cmd /k "cd frontend && npm run dev"

:: 3. 5초 대기 후 브라우저 열기 (서버 켜지는 시간 확보)
timeout /t 5 > nul
start http://localhost:5173

exit