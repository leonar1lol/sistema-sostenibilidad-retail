@echo off
cd /d "%~dp0"
echo ======================================================================
echo Sincronizando cambios locales con GitHub...
echo ======================================================================
echo.

echo [1/3] Estado de archivos locales...
git status -s
echo.

echo [2/3] Registrando commit de produccion...
git add .
git commit -m "feat(ui/admin): mejoras integrales en navegacion, filtros y validaciones de produccion"
echo.

echo [3/3] Subiendo cambios a la rama main de GitHub...
git push origin main
echo.

echo ======================================================================
echo Sincronizacion completada con exito en GitHub.
echo ======================================================================
pause
