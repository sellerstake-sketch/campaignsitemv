@echo off
echo ========================================
echo Starting Local Development Server...
echo ========================================
echo.
echo Server will start on: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server when done
echo.
pause
echo.
python -m http.server 8000
