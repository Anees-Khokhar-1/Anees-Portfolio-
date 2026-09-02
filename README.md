---
title: Anees AI Digital Twin Portfolio
emoji: ⚡
colorFrom: blue
colorTo: purple
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
license: mit
---

# 🚀 Anees Munir Khokhar — RAG AI Digital Twin & AI Engineering Portfolio

![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![OpenRouter](https://img.shields.io/badge/AI_Engine-OpenRouter_Auto-blue?style=for-the-badge&logo=openai&logoColor=white)
![Hugging Face](https://img.shields.io/badge/Deployment-Hugging_Face_Spaces-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)
![Vercel](https://img.shields.io/badge/Frontend-Vercel_Static-000000?style=for-the-badge&logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

Production-grade personal portfolio and live **RAG-Powered AI Digital Twin** created by **Anees Munir Khokhar**, AI Engineer specializing in production RAG pipelines, computer vision, agentic systems, and high-concurrency FastAPI backends.

---

## 🌟 Key Architecture & Features

### 1. 🧠 Live RAG-Powered AI Digital Twin Chatbot
- **Engine:** Dynamic Retrieval-Augmented Generation powered by **OpenRouter Auto (`openrouter/auto`)** with fallback to Meta Llama-3.3-70B, DeepSeek-V3, and Qwen 2.5-72B.
- **Vector Retrieval:** Deterministic Scikit-Learn TF-IDF Cosine Vector Store (`rag_engine.py`) indexing 47 semantic document chunks from [`knowledge.json`](backend/knowledge.json).
- **Sub-Millisecond Zero-Latency Interceptors:** Instant streaming (<0.001s) for common greetings, name inquiries, and capability prompts.
- **Real-Time SSE Token Streaming:** High-performance Server-Sent Events streaming via `/api/chat/stream` for low-latency response delivery.
- **Ephemeral Sessions:** Every browser refresh triggers a 100% clean session with zero residual state.

### 2. 🛡️ 3-Layer Defense-in-Depth Security Shield
- **Layer 1 (Regex Firewall):** Intercepts prompt injections, amnesia attacks (`forget all instructions`), system prompt leaks, and delimiter smuggling before reaching LLM API.
- **Layer 1.5 (Strict Scope Shield):** Blocks out-of-scope queries (recipes, general trivia, math equations) with exact personal assistant refusal statement.
- **Layer 2 (Identity & Persona Lock):** Enforces strict persona bounds (forbids meta-AI commentary) and locks portfolio facts (e.g., Easy-Study is ranked #1 flagship project, exact project count is 10).
- **Layer 3 (Output Audit):** Real-time response sanitization blocking hallucinated phrases (`"trained on"`, `"training data"`, `"don't have an exact count"`).

### 3. 📊 Privacy-Compliant Recruiter Analytics
- Stores contact submissions and anonymous analytics in local SQLite database (`backend/recruiter_queries.db`).
- Implements salted SHA-256 IP hashing and 90-day auto-purge compliant with UAE PDPL and Pakistan PECA data privacy regulations.

### 4. 📄 Executive Digital Resume & Hero AI Gateway
- **Hero Gateway (`index.html`):** Direct question prompt router that automatically routes queries into the chat interface.
- **Executive Paper Resume (`resume.html`):** Print-optimized ATS layout with direct PDF download support (`assets/Anees.pdf`).

### 5. 🎙️ Multimodal Voice Assistant & Web Audio Architecture
- **4-State Visual Machine:** Real-time state machine transitioning across `IDLE` ➔ `LISTENING` ➔ `THINKING` ➔ `SPEAKING` with distinct visual animations.
- **Web Audio API Frequency Equalizer:** 12 dynamic visualizer bars driven by `AnalyserNode` frequency bin scaling in real-time.
- **Live Ghost Transcript Preview:** Real-time translucent overlay showing speech interim results while speaking.
- **Text-to-Speech (TTS) Voice Engine:** Edge-TTS / Kokoro ONNX voice generation engine with male neural voice (`en-US-ChristopherNeural`).

---

## 📁 Master Portfolio Projects Showcase (10 Production Projects)

| # | Project Name | Domain & Tech Stack | Description & Impact |
|---|---|---|---|
| 1 | **Easy-Study** *(Flagship)* | Multi-Model RAG, FAISS, FastAPI, LangChain, PyTorch | **#1 Flagship Project:** AI study assistant processing PDFs, YouTube, web articles, and notes with multi-provider LLM orchestration and GitHub Actions CI/CD. |
| 2 | **BidOS** | Document Intelligence, OCR, REST API Gateway, Python | AI-powered Bid & Proposal Response Engine converting complex tender docs (PDF/DOCX) into structured proposal workspaces with 15+ API endpoints and win scoring. |
| 3 | **SOL** | Multimodal Agentic AI, Voice AI, Gemini Live, MCP | Voice-first multimodal AI desktop assistant utilizing Google Gemini Live, screen/camera vision, and Model Context Protocol (MCP) tool orchestration. |
| 4 | **Smart Garbage Detection System** | Computer Vision, Edge AI, YOLOv11, OpenCV, PyTorch | Real-time computer vision system detecting urban waste for automated municipal sorting and smart city management. |
| 5 | **TourCheckNow** | Data Scraping, RAG Recommendation, GPT-4, FastAPI | Automated web scraping & pricing intelligence pipeline for Techozon client aggregating listings across 7+ cities (70-80% manual effort reduction). |
| 6 | **Shop and Bid** | Computer Vision, E-Commerce AI, Groq LLM, Cloud Vision | AI product listing & marketplace price comparison engine integrating Google Cloud Vision and Groq LLMs. |
| 7 | **Super Calendar (JJ Voice Assistant)** | Voice AI, Ollama Qwen 2.5-72B, Faster-Whisper, WebSockets | Jarvis-style real-time voice assistant for Techozon supporting voice-driven task and employee management with barge-in interruption. |
| 8 | **Cedric Fitness** | Mobile AI Backend, FastAPI, Diet Intelligence, REST APIs | Personalized allergy-aware diet planning and workout tracking backend for a live mobile application. |
| 9 | **Fruit Classification System** | Deep Learning, CNN, PyTorch, TensorFlow, OpenCV | Convolutional Neural Network image classifier categorizing agricultural produce with high validation accuracy. |
| 10 | **Headout XHR Scraping** | Data Engineering, XHR Analysis, Pandas | Data extraction pipeline analyzing XHR endpoints to collect structured pricing data at 10x speed over browser automation. |

---

## 📂 Project Directory Structure

```text
.
├── assets/                  # High-resolution cards, avatar images, and downloadable PDF resume
│   ├── Anees.pdf            # Downloadable executive PDF resume
│   ├── bidos_preview.jpg    # BidOS Proposal Workspace UI preview
│   ├── sol_preview.jpg      # SOL Voice Desktop Assistant UI preview
│   ├── avatar.png           # Chatbot avatar profile icon
│   └── profile.jpg          # Executive bio photo
├── backend/                 # Core Python backend package
│   ├── analytics.py         # Privacy-compliant SQLite analytics & IP hashing module
│   ├── app.py              # Main FastAPI app, security firewall, zero-latency interceptors, and API endpoints
│   ├── knowledge.json       # Structured factual knowledge base (10 projects & Techozon achievements)
│   ├── rag_engine.py       # Scikit-Learn TF-IDF Cosine RAG Engine
│   └── tests/               # Regression test suite
│       ├── test_rag.py      # RAG retrieval precision & memory footprint tests
│       ├── test_shield.py   # Security firewall, scope shield, & persona lock tests
│       └── test_speech.py   # Speech STT & TTS pipeline tests
├── Dockerfile               # Container setup for Hugging Face Spaces (Port 7860)
├── README.md                # Technical documentation & HF Space configuration
├── .env.example             # Environment configuration template
├── chat.html                # Terminal-style AI Digital Twin chat interface
├── chat.js                  # SSE client parser, gradient headings, and relative API routing
├── index.html               # Main portfolio landing page & Hero AI Gateway
├── privacy.html             # Privacy policy & data protection details
├── requirements.txt         # Consolidated Python dependencies
├── resume.html              # Executive Paper digital resume with ATS layout
├── server.py                # Unified FastAPI production runner (Port 7860)
└── style.css                # CSS variable design system, glassmorphism, and animations
```

---

## ⚡ Quick Start: Running Locally

Launch the complete application (FastAPI backend + static frontend) on unified port **7860** using a single command:

### 1. Clone & Setup Environment

```powershell
git clone https://github.com/Anees-Khokhar-1/Anees-Portfolio-.git
cd Anees-Portfolio-

# Create .env file with your API Key
cp .env.example .env
```

### 2. Launch Unified Server

```powershell
python server.py 7860
```

### 3. Open in Browser

- **Portfolio Landing Page:** [http://localhost:7860/](http://localhost:7860/)
- **AI Digital Twin Chat:** [http://localhost:7860/chat](http://localhost:7860/chat)
- **Executive Paper Resume:** [http://localhost:7860/resume](http://localhost:7860/resume)

---

## 🧪 Automated Testing & QA Suite

Run the full automated unittest suite (20 test cases covering RAG retrieval precision, persona locking, scope shield, speech pipeline, and security firewall rules):

```powershell
python -m unittest discover -s backend/tests -v
```

**Expected Output:** `Ran 20 tests in 3.65s ... OK`

---

## 📜 License & Contact

- **Author:** Anees Munir Khokhar
- **Role:** AI Engineer (RAG Systems, Agentic AI, Computer Vision, FastAPI Backends)
- **Location:** Islamabad, Pakistan
- **Email:** aneesmunir1020@gmail.com
- **License:** [MIT License](LICENSE)
