/*
  Edit this file whenever you complete a new project or learn a new skill.
  The website reads these lists automatically — no HTML editing required.

  For a free project demo, upload the video to YouTube as Unlisted and add:
  demoUrl: "https://youtu.be/YOUR_VIDEO_ID"
*/
export const PORTFOLIO_DATA = {
  projects: [
    {
      featured: true,
      category: "FULL-STACK RAG ENGINE",
      title: "Easy-Study — Multi-Model Study Assistant",
      description: "A full-stack RAG platform that ingests PDFs, YouTube videos, web articles, and notes, then embeds content with Hugging Face into a local FAISS vector store. Its core engine enables runtime switching across Gemini, OpenRouter, Ollama, and OpenAI, with confidence-based fallback for low-similarity queries.",
      technologies: ["FastAPI", "LangChain", "FAISS", "Hugging Face", "Ollama", "GitHub Actions"],
      url: "https://github.com/Anees-Khokhar-1/Easy-Study",
      linkLabel: "Open Easy-Study repo",
      terminalFile: "easy_study_pipeline.py",
      terminalLines: [
        { tone: "ok", text: "Ingesting PDF / YouTube / web payload..." },
        { tone: "faint", text: "Embedding with all-MiniLM-L6-v2" },
        { tone: "faint", text: "Indexing local FAISS vector store" },
        { tone: "blue", text: "Confidence score: 0.94" },
        { tone: "orange", text: "Route: DeepSeek-R1 / zero restart" }
      ]
    },
    {
      title: "AI Products Description Generator",
      description: "AI content-generation system for producing product descriptions with prompt-driven workflows, clean backend logic, and reusable generation patterns.",
      technologies: ["Python", "LLMs", "Prompt Engineering"],
      url: "https://github.com/Anees-Khokhar-1/AI-Products-Description-Generator"
    },
    {
      title: "Smart Garbage Detection System",
      description: "YOLOv11 waste classification for smart-city operations with computer-vision dataset preparation, model inference, and a dashboard layer for real-time analytics.",
      technologies: ["YOLOv11", "OpenCV", "Computer Vision", "Dataset Engineering"],
      url: "https://github.com/Anees-Khokhar-1/Smart-Garbage-Detection"
    },
    {
      title: "Tourist LLM",
      description: "LLM-powered travel assistant project focused on conversational guidance, retrieval-style responses, and practical user-facing AI interaction.",
      technologies: ["LLMs", "Python", "RAG"],
      url: "https://github.com/Anees-Khokhar-1/Tourist-llm-"
    },
    {
      title: "ConVochaT",
      description: "Conversational AI application showing chat-product thinking, model integration, and end-to-end AI feature delivery.",
      technologies: ["AI Chat", "Python", "LLMs"],
      url: "https://github.com/Anees-Khokhar-1/ConVochaT"
    },
    {
      title: "Headout XHR Scraping",
      description: "Data extraction system built around XHR request analysis, structured scraping, and clean data collection workflows.",
      technologies: ["Web Scraping", "XHR", "Data Engineering"],
      url: "https://github.com/Anees-Khokhar-1/Headout_XHR-Scrapping-"
    },
    {
      title: "Personal Expense Tracker",
      description: "Full-stack CRUD-style application for tracking expenses, managing records, and practicing reliable backend and database flows.",
      technologies: ["Full Stack", "CRUD", "Database"],
      url: "https://github.com/Anees-Khokhar-1/Personal-Expense-Tracker"
    },
    {
      title: "AI Study Assistant",
      description: "Study-focused assistant project applying AI workflows to learning support, question answering, and student productivity.",
      technologies: ["AI Assistant", "Python", "LLMs"],
      url: "https://github.com/Anees-Khokhar-1/ai-study-assistant"
    },
    {
      title: "Fruit Classification System",
      description: "CNN image-classification pipeline covering dataset preprocessing, training, validation, and model evaluation.",
      technologies: ["TensorFlow", "Keras", "CNN"],
      url: "https://github.com/Anees-Khokhar-1/fruitclassification"
    }
  ],

  skills: {
    "Agentic AI & Orchestration": ["Multi-Agent Workflows", "Agentic AI Architecture", "Layered Agent Systems", "LangGraph Orchestration", "CrewAI", "OpenClaw"],
    "AI & GenAI": ["LLMs", "AI Agents", "Hugging Face Transformers", "RAG", "Fine-Tuning", "Prompt Engineering"],
    "Protocols & Integrations": ["MCP Server Development", "Agent Tool Integration"],
    "Deep Learning & CV": ["PyTorch", "TensorFlow", "Keras", "ANN", "CNN", "RNN", "YOLOv11", "OpenCV", "MediaPipe"],
    "Backend & APIs": ["REST APIs (GET / POST / PUT / PATCH / DELETE)", "CRUD Design", "FastAPI", "Flask", "API Integration"],
    "Databases & Retrieval": ["PostgreSQL", "MongoDB", "SQL", "NoSQL", "SQLite", "Vector Databases", "FAISS"],
    "Data & Dataset Engineering": ["Computer Vision Dataset Creation & Curation", "Dataset Preprocessing", "Web Scraping", "Pandas"],
    "Product Engineering": ["Full-Stack Development", "End-to-End AI Development", "Backend Architecture", "Model Integration", "Testing & Deployment"],
    "DevOps & Quality": ["GitHub Actions", "pytest", "mypy", "Bandit", "Git", "Pylint"]
  }
};
