@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   생활에 도움이 되는 프로그램 - 발행(업로드)
echo ============================================
echo.
echo [1/4] 최신 상태 받기...
git pull --no-edit
echo.
echo [2/4] 변경사항 담기...
git add -A
echo.
echo [3/4] 기록 남기기...
git commit -m "update site" || echo (변경사항 없음 - 건너뜀)
echo.
echo [4/4] GitHub에 올리기...
git push
echo.
echo ============================================
echo   완료! 1~2분 뒤 아래 주소에 반영됩니다.
echo   https://hey7995.github.io
echo ============================================
pause
