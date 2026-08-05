---
title: Anees AI Digital Twin Portfolio
emoji: ⚡
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# 🚀 Anees Munir Khokhar — RAG AI Digital Twin & AI Engineering Portfolio

![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Groq Cloud](https://img.shields.io/badge/AI_Engine-Groq_Llama--3.3--70b-orange?style=for-the-badge&logo=openai&logoColor=white)
![Hugging Face](https://img.shields.io/badge/Deployment-Hugging_Face_Spaces-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)
![Vercel](https://img.shields.io/badge/Frontend-Vercel_Static-000000?style=for-the-badge&logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

Production-grade personal portfolio and live **RAG-Powered AI Digital Twin** created by **Anees Munir Khokhar**, AI Engineer specializing in production RAG pipelines, computer vision, agentic systems, and high-concurrency FastAPI backends.

---

## 🌟 Key Architecture & Features

### 1. 🧠 Live RAG-Powered AI Digital Twin Chatbot
- **Engine:** Dynamic Retrieval-Augmented Generation powered by **Groq Llama-3.3-70b-versatile** with automatic model fallback.
- **Vector Retrieval:** Deterministic Scikit-Learn TF-IDF Cosine Vector Store (`rag_engine.py`) indexing 42 semantic document chunks from [`knowledge.json`](backend/knowledge.json).
- **Real-Time SSE Token Streaming:** High-performance Server-Sent Events streaming via `/api/chat/stream` for zero-latency response delivery.
- **Ephemeral Sessions:** Every browser refresh triggers a 100% clean session with zero residual state.

### 2. 🛡️ 3-Layer Defense-in-Depth Security Shield
- **Layer 1 (Regex Firewall):** Intercepts prompt injections, amnesia attacks (`forget all instructions`), system prompt leaks, and delimiter smuggling before reaching LLM API.
- **Layer 2 (Identity & Persona Lock):** Enforces strict persona bounds (forbids meta-AI commentary like *"as an AI language model"*) and locks portfolio facts (e.g., Easy-Study is ranked #1 flagship project, exact project count is 8).
- **Layer 3 (Output Audit):** Real-time response sanitization blocking hallucinated phrases (`"trained on"`, `"training data"`, `"don't have an exact count"`).

### 3. 📊 Privacy-Compliant Recruiter Analytics
- Stores contact submissions and anonymous analytics in local SQLite database (`backend/recruiter_queries.db`).
- Implements salted SHA-256 IP hashing and 90-day auto-purge compliant with UAE PDPL and Pakistan PECA data privacy regulations.

### 4. 📄 Executive Digital Resume & Hero AI Gateway
- **Hero Gateway (`index.html`):** Direct question prompt router that automatically routes queries into the chat interface.
- **Executive Paper Resume (`resume.html`):** Print-optimized ATS layout with direct PDF download support (`assets/Anees.pdf`).

---

## 📁 Master Portfolio Projects Showcase (8 Production Projects)

| # | Project Name | Domain & Tech Stack | Description & Impact |
|---|---|---|---|
| 1 | **Easy-Study** *(Flagship)* | Multi-Model RAG, FAISS, FastAPI, LangChain, PyTorch | **#1 Flagship Project:** AI study assistant processing PDFs, YouTube, web articles, and notes with multi-provider LLM orchestration and GitHub Actions CI/CD. |
| 2 | **Smart Garbage Detection System** | Computer Vision, Edge AI, YOLOv11, OpenCV, PyTorch | Real-time computer vision system detecting urban waste for automated municipal sorting and smart city management. |
| 3 | **AI Products Description Generator** | Generative AI, LLMs, FastAPI, REST APIs | Automated e-commerce copy generator producing SEO-optimized product descriptions from technical attributes. |
| 4 | **Fruit Classification System** | Deep Learning, CNN, PyTorch, TensorFlow, OpenCV | Convolutional Neural Network image classifier categorizing agricultural produce with high validation accuracy. |
| 5 | **Headout XHR Scraping** | Data Engineering, XHR Analysis, Pandas | Data extraction pipeline analyzing XHR endpoints to collect structured pricing data at 10x speed over browser automation. |
| 6 | **Personal Expense Tracker** | Full-Stack CRUD, RESTful API, SQLite | Full-stack financial management app with interactive metrics, itemized budget tracking, and relational data storage. |
| 7 | **Tourist LLM** | RAG Recommendation, LangChain, Vector DB | AI travel concierge serving personalized destination itineraries from curated tourism knowledge bases. |
| 8 | **ConVochaT** | Conversational AI, FastAPI, WebSockets | Real-time chat platform supporting multi-user messaging channels and instant socket connections. |

---

## 📂 Project Directory Structure

```text
.
├── assets/                  # High-resolution cards, avatar images, and downloadable PDF resume
│   ├── Anees.pdf            # Downloadable executive PDF resume
│   ├── avatar.png           # Chatbot avatar profile icon
│   ├── profile.jpg          # Executive bio photo
│   └── card-*.png           # Dashboard card background textures
├── backend/                 # Core Python backend package
│   ├── analytics.py         # Privacy-compliant SQLite analytics & IP hashing module
│   ├── app.py              # Main FastAPI app, security firewall, and API endpoints
│   ├── knowledge.json       # Structured factual knowledge base (8 projects & persona profile)
│   ├── rag_engine.py       # Scikit-Learn TF-IDF Cosine RAG Engine
│   └── tests/               # Regression test suite
│       ├── test_rag.py      # 4 RAG retrieval precision & memory footprint tests
│       └── test_shield.py   # 10 security firewall & persona lock tests
├── Dockerfile               # Container setup for Hugging Face Spaces (Port 7860)
├── README.md                # Technical documentation & HF Space configuration
├── chat.html                # Terminal-style AI Digital Twin chat interface
├── chat.js                  # SSE client parser, gradient headings, and relative API routing
├── favicon.svg              # SVG brand favicon icon
├── index.html               # Main portfolio landing page & Hero AI Gateway
├── llms.txt                 # Clean LLM agent context file
├── privacy.html             # Privacy policy & data protection details
├── requirements.txt         # Consolidated Python dependencies
├── resume.html              # Executive Paper digital resume with ATS layout
├── robots.txt               # Search engine crawler permissions
├── script.js                # Modal handlers, ask-bar routing, and contact form submitter
├── server.py                # Unified FastAPI production runner (Port 7860)
├── site.webmanifest         # PWA web manifest definition
├── sitemap.xml              # XML search engine sitemap
├── style.css                # CSS variable design system, glassmorphism, and animations
└── vercel.json              # Static hosting configuration & CSP headers
```

---

## ⚡ Quick Start: Running Locally

Launch the complete application (FastAPI backend + static frontend) on unified port **7860** using a single command:

### 1. Clone & Setup Environment

```powershell
git clone https://github.com/Anees-Khokhar-1/Anees-Portfolio-.git
cd Anees-Portfolio-

# Create .env file with your Groq API Key
echo GROQ_API_KEY=gsk_your_groq_api_key_here > .env
```

### 2. Launch Unified Server

```powershell
python server.py 7860
```

### 3. Open in Browser

- **Portfolio Landing Page:** [http://localhost:7860/](http://localhost:7860/)
- **AI Digital Twin Chat:** [http://localhost:7860/chat](http://localhost:7860/chat)
- **Executive Paper Resume:** [http://localhost:7860/resume](http://localhost:7860/resume)
- **Privacy Policy:** [http://localhost:7860/privacy](http://localhost:7860/privacy)

---

## 🧪 Automated Testing & QA Suite

Run the full automated unittest suite (14 test cases covering RAG retrieval precision, persona locking, and security firewall rules):

```powershell
python -m unittest -v backend.tests.test_shield backend.tests.test_rag
```

**Expected Output:** `Ran 14 tests in 0.033s ... OK`

---

## 🌐 Deployment Architecture

- **Hugging Face Spaces (Backend & Full-Stack):** Configured via [`Dockerfile`](Dockerfile) running natively on `0.0.0.0:7860` with `sdk: docker`.
- **Vercel (Frontend Static Host):** Configured via [`vercel.json`](vercel.json) with clean URL rewriting and Content Security Policy (CSP) protection.

---

## 📜 License & Contact

- **Author:** Anees Munir Khokhar
- **Role:** AI Engineer (RAG Systems, Computer Vision, FastAPI Backends)
- **Location:** Islamabad, Pakistan
- **License:** [MIT License](LICENSE)
