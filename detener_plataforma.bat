@echo off
chcp 65001 > nul
title Detener Plataforma - Retail Connect

echo ======================================================================
echo    DETENIENDO SERVICIOS DE LA PLATAFORMA
echo ======================================================================
echo.

taskkill /F /IM node.exe > nul 2>&1

echo Los servidores backend y frontend han sido detenidos.
echo.
pause
