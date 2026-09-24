@echo off
cd /d "%~dp0"
echo ======================================================================
echo Sincronizando cambios locales con GitHub...
echo ======================================================================
echo.

echo [1/3] Descargando e integrando cambios remotos de GitHub...
git pull origin main --no-edit -X ours
echo.

echo [2/3] Registrando cualquier archivo pendiente...
git add .
git commit -m "feat(ui/admin): consolidacion de mejoras en interfaz y navegacion" 2>nul
echo.

echo [3/3] Subiendo cambios a la rama main de GitHub...
git push origin main
echo.

echo ======================================================================
echo Sincronizacion completada con exito en GitHub.
echo ======================================================================
pause
