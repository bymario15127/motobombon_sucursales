@echo off
echo ========================================
echo Inicializando bases de datos multisucursal
echo ========================================
echo.

cd /d "%~dp0backend"

echo [1/2] Creando estructura de bases de datos...
node database/initSucursales.js

echo.
echo [2/2] Cargando datos iniciales...
node database/initAllSucursales.js

echo.
echo ========================================
echo COMPLETADO - Bases de datos listas
echo ========================================
echo.
echo Cada sucursal tiene:
echo - 5 servicios
echo - 3 lavadores
echo - 2 talleres aliados
echo - 5 productos
echo - 2 clientes de ejemplo
echo - Usuarios admin independientes
echo.
echo ========================================
echo CREDENCIALES POR SUCURSAL
echo ========================================
echo.
echo SUCURSAL CENTRO:
echo   Admin: admin_centro / centro123
echo   Supervisor: supervisor_centro / supercentro2026*
echo.
echo SUCURSAL SUR:
echo   Admin: admin_sur / Bombonsur2026*
echo   Supervisor: supervisor_sur / supersur2026*
echo.
echo ========================================
pause
