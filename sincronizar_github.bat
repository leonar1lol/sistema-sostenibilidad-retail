@echo off
cd /d "%~dp0"
echo ======================================================================
echo Sincronizando cambios locales con GitHub...
echo ======================================================================
echo.

echo [1/3] Integrando historiales remotos con GitHub...
git pull origin main --allow-unrelated-histories --no-edit -X ours
echo.

echo [2/3] Confirmando consolidacion de cambios...
git add .
git commit -m "feat(ui/admin): integracion de versiones y mejoras de produccion" 2>nul
echo.

echo [3/3] Subiendo cambios consolidados a la rama main...
git push origin main
echo.

echo ======================================================================
echo Sincronizacion completada con exito en GitHub.
echo ======================================================================
pause
