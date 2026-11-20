@echo off
setlocal
set "APP=%~dp0..\release\MintOS-0.0.0-x64-portable.exe"
if not exist "%APP%" (
  echo O iniciador ainda nao foi gerado.
  echo Execute "Build Mint OS for Windows.bat" primeiro.
  pause
  exit /b 1
)
start "" "%APP%"