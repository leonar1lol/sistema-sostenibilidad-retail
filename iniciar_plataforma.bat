@echo off
chcp 65001 > nul
title Iniciador - Plataforma Retail Connect

echo ======================================================================
echo    INICIANDO PLATAFORMA DE SOSTENIBILIDAD - INTERCORP RETAIL
echo ======================================================================
echo.

cd /d "%~dp0"

echo [1/3] Iniciando Servidor Backend (Puerto 4000)...
start "Servidor Backend - Retail Connect" cmd /k "cd /d "%~dp0servidor" && node --watch src/indice.js"

timeout /t 2 /nobreak > nul

echo [2/3] Iniciando Cliente Web Frontend (Puerto 5173)...
start "Cliente Frontend - Retail Connect" cmd /k "cd /d "%~dp0cliente" && npm run desarrollo"

timeout /t 3 /nobreak > nul

echo [3/3] Abriendo aplicacion en el navegador...
start http://localhost:5173

echo.
echo ======================================================================
echo    PLATAFORMA INICIADA CORRECTAMENTE
echo ======================================================================
echo  - Frontend Web:     http://localhost:5173
echo  - Servidor Backend: http://localhost:4000
echo.
echo  Para detener la plataforma, simplemente cierre las dos ventanas de consola.
echo ======================================================================
pause
