@echo off
REM Simple run script - no dependency install

echo.
echo Starting MyJudicial AI Service...
echo.

call venv\Scripts\activate

echo Server starting on http://localhost:5000
echo API Docs: http://localhost:5000/docs
echo.

uvicorn app.main:app --reload --port 5000
