@echo off
REM Quick start script for Windows

echo.
echo ========================================
echo MyJudicial AI Triage Service
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate
echo.

REM Install/update dependencies
echo Installing dependencies...
pip install -r requirements.txt
echo.

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo.
    echo ⚠️  Please edit .env file with your configuration!
    echo.
    pause
)

REM Start the server
echo Starting AI service on http://localhost:5000
echo.
echo API Documentation: http://localhost:5000/docs
echo Health Check: http://localhost:5000/health
echo.
echo Press Ctrl+C to stop the server
echo.

uvicorn app.main:app --reload --port 5000
