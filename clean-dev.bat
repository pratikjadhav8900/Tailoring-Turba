@echo off
echo ========================================================
echo   Tailoring Turba - Clean Dev Server & CSS Cache Fixer
echo ========================================================
echo.
echo Cleaning .next cache...
if exist .next (
  rmdir /s /q .next
  echo [OK] .next directory removed.
) else (
  echo [OK] .next directory already clean.
)
echo.
echo Starting development server...
npm run dev
