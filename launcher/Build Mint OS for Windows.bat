@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0.."

echo Construindo Mint OS para Windows...
call npm run build
if errorlevel 1 (
  echo Falha ao construir a interface.
  pause
  exit /b 1
)

call npx electron-builder --win portable --x64 --config electron-builder.yml
if errorlevel 1 (
  echo Falha ao gerar o iniciador .exe.
  pause
  exit /b 1
)

echo.
echo Pronto: abra a pasta release e execute MintOS-0.0.0-x64-portable.exe
pause