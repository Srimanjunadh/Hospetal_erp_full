@echo off
echo Starting MediClues ERP Backend on port 5000...
echo Ensure your frontend is pointing to http://localhost:5000
set PYTHONIOENCODING=utf-8
python -m uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
