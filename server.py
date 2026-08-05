#!/usr/bin/env python3
"""
Anees AI Digital Twin — Production Hugging Face Spaces Entry Point
Unified FastAPI Application serving static frontend and dynamic RAG backend
on host 0.0.0.0 and port 7860 (Hugging Face default).
"""
import os
import sys
from pathlib import Path

# Add project root directory to python path
ROOT_DIR = Path(__file__).parent
sys.path.insert(0, str(ROOT_DIR))

import uvicorn
from fastapi.staticfiles import StaticFiles

# Import the core FastAPI app from backend module
from backend.app import app

# Mount assets directory if it exists
assets_dir = ROOT_DIR / "assets"
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

if __name__ == "__main__":
    # Retrieve port from command line or environment variable, defaulting to Hugging Face port 7860
    port = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("PORT", 7860))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"[SERVER] Starting Anees Portfolio AI Twin on http://{host}:{port} (Hugging Face Spaces)")
    uvicorn.run("server:app", host=host, port=port, reload=False, log_level="info")
