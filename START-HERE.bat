@echo off
title Campaign Management System - Server Startup
color 0A
cls
echo.
echo ===================================================================
echo   POLITICAL ELECTION CAMPAIGN MANAGEMENT SYSTEM
echo   MALDIVES - Development Server
echo ===================================================================
echo.
echo Starting HTTP server on port 8000...
echo.
echo IMPORTANT: After the server starts:
echo   1. Open your web browser
echo   2. Go to: http://localhost:8000/index.html
echo   3. DO NOT double-click the HTML file directly!
echo.
echo Press Ctrl+C to stop the server when you're done.
echo.
echo ===================================================================
echo.
pause
python -m http.server 8000

