#!/usr/bin/env python3
"""
Anees AI Digital Twin — Hugging Face Gradio SDK Entry Point (app.py)
Unified FastAPI application serving static portfolio frontend and dynamic RAG backend.
"""
import os
import sys
from pathlib import Path
import uvicorn
from fastapi.staticfiles import StaticFiles
import gradio as gr

# Add project root directory to python path
ROOT_DIR = Path(__file__).parent
sys.path.insert(0, str(ROOT_DIR))

# Import core FastAPI app from backend package
from backend.app import app

# Mount assets directory if present
assets_dir = ROOT_DIR / "assets"
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

# Mount a lightweight Gradio interface wrapper for Hugging Face Space health compatibility
with gr.Blocks(title="Anees AI Digital Twin") as demo:
    gr.Markdown("# ⚡ Anees AI Digital Twin & Portfolio")
    gr.HTML("<script>window.location.href = '/';</script>")

# Combine FastAPI and Gradio
app = gr.mount_gradio_app(app, demo, path="/gradio")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
