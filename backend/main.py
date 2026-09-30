"""UCompass backend.

Run from this folder:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
"""

import logging
import os
from pathlib import Path

# Load backend/.env if python-dotenv is installed (keys stay on the server).
try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).with_name(".env"))
except ImportError:
    pass

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

import voice  # noqa: E402
from router import router  # noqa: E402

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

app = FastAPI(title="UCompass Paw API", version="0.2.0")

# The Vite dev proxy means the browser normally calls /api on its own origin,
# so CORS only matters if someone points VITE_PAW_API_URL straight at :8000.
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(router)
app.include_router(voice.router)
