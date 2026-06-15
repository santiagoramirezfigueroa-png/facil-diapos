@echo off
title Servidor de Desarrollo - RevealPPTX
echo =======================================================
echo               REVEALPPTX SLIDE BUILDER
echo =======================================================
echo.
echo [1/2] Abriendo el navegador en http://localhost:5173...
start http://localhost:5173
echo.
echo [2/2] Iniciando el servidor de desarrollo Vite...
npm run dev
pause
