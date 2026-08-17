@echo off
echo =======================================================
echo Starting AMSF System (Node.js + React + Python ML API)
echo =======================================================

echo [1/3] Memulai Express Server (Port 3000)...
start "AMSF Express (Backend)" cmd /k "node server.js"

echo [2/3] Memulai React Frontend (Port 5173)...
start "AMSF React (Frontend)" cmd /k "npm run dev"

echo [3/3] Memulai Python FastAPI (Port 8000)...
start "AMSF ML API (Python)" cmd /k "cd python_api && python -m uvicorn main:app --port 8000"

echo.
echo Selesai! Semua layanan telah dijalankan pada jendela terminal yang terpisah.
echo Anda bisa memantau log masing-masing di jendelanya sendiri.
echo Silakan buka http://localhost:5173 di browser Anda.
pause
