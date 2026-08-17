@echo off
echo Starting MediClues ERP Backend on port 8000...
echo Ensure your frontend is pointing to http://localhost:8000
set PYTHONIOENCODING=utf-8
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
