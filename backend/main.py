"""UCompass backend.

Run from this folder:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
"""

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from router import router

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
