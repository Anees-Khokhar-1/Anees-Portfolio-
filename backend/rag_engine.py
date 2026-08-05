import os
import json
import math
import re
from functools import lru_cache
from typing import List, Dict, Any, Optional

# Attempt to import scikit-learn or FAISS if available in environment
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

try:
    import faiss
    from sentence_transformers import SentenceTransformer
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False


class KnowledgeChunker:
    """Chunks the raw knowledge.json structure into granular, high-signal semantic documents."""

    @staticmethod
    def chunk_knowledge_base(kb: Dict[str, Any]) -> List[Dict[str, Any]]:
        if not isinstance(kb, dict):
            return []

        chunks = []

        # 1. Projects Chunks
        for idx, p in enumerate(kb.get("projects", [])):
            name = p.get("name", f"Project-{idx}")
            category = p.get("category") or p.get("type", "AI Engineering")
            tech = p.get("tech") or p.get("architecture", "")
            if isinstance(tech, list):
                tech = ", ".join(tech)
            problem = p.get("problem") or p.get("description", "")
            role = p.get("my_role", "AI Engineer")
            github = p.get("github", "")
            
            content = (
                f"Project Title: {name} | Category: {category}\n"
                f"Role: {role}\n"
                f"Tech Stack / Architecture: {tech}\n"
                f"Description / Problem Solved: {problem}\n"
                f"GitHub Repository: {github}"
            )
            is_flagship = "easy-study" in name.lower() or idx == 0
            extra_kw = "best project flagship project top project number 1 main project #1" if is_flagship else ""
            chunks.append({
                "chunk_id": f"project_{idx}",
                "chunk_type": "project",
                "title": name,
                "keywords": f"{name} {category} {tech} project portfolio github {extra_kw}",
                "content": content
            })

        # 2. Recruiter FAQ Chunks
        for key, val in kb.get("recruiter_faq", {}).items():
            if isinstance(val, dict):
                question = val.get("question", key)
                answer = val.get("answer", "")
            else:
                question = key
                answer = str(val)
            
            chunks.append({
                "chunk_id": f"faq_{re.sub(r'[^a-zA-Z0-9]', '_', key)[:30]}",
                "chunk_type": "faq",
                "title": f"FAQ: {question}",
                "keywords": f"faq question answer recruiter hr {question}",
                "content": f"Question: {question}\nAnswer: {answer}"
            })

        # 3. Technical Interview Q&A Chunks
        for key, val in kb.get("technical_interview_answers", {}).items():
            if isinstance(val, dict):
                topic = val.get("topic", key)
                detail = val.get("answer", "")
            else:
                topic = key
                detail = str(val)
            
            chunks.append({
                "chunk_id": f"tech_{re.sub(r'[^a-zA-Z0-9]', '_', key)[:30]}",
                "chunk_type": "technical",
                "title": f"Technical Q&A: {topic}",
                "keywords": f"technical interview architecture system design ai rag yolo {topic}",
                "content": f"Topic: {topic}\nTechnical Explanation: {detail}"
            })

        # 4. Sample Answers Chunks
        for key, val in kb.get("sample_answers", {}).items():
            chunks.append({
                "chunk_id": f"sample_{re.sub(r'[^a-zA-Z0-9]', '_', key)[:30]}",
                "chunk_type": "sample_answer",
                "title": f"Sample Response: {key}",
                "keywords": f"sample answer interview response {key}",
                "content": f"Scenario / Question Type: {key}\nSample Response: {val}"
            })

        # 5. Availability & Relocation Chunk
        avail = kb.get("availability", {})
        if avail:
            status = avail.get("status", "Immediately Available")
            modes = avail.get("work_modes", "Remote, On-site, Hybrid")
            reloc = avail.get("relocation", "Open to relocation")
            pref = avail.get("preferred_locations", "")
            if isinstance(pref, list):
                pref = ", ".join(pref)
            content = (
                f"Availability Status: {status}\n"
                f"Work Modes: {modes}\n"
                f"Relocation Policy: {reloc}\n"
                f"Preferred Locations: {pref}"
            )
            chunks.append({
                "chunk_id": "availability_and_relocation",
                "chunk_type": "availability",
                "title": "Anees Availability, Work Modes & Relocation Readiness",
                "keywords": "availability relocation relocate onsite remote hybrid immediate join work mode city country",
                "content": content
            })

        # 6. Skills & Proficiency Chunk
        skills = kb.get("skills_with_levels", {})
        if skills:
            skill_lines = []
            for domain, s_list in skills.items():
                if isinstance(s_list, list):
                    skill_lines.append(f"{domain}: {', '.join([s if isinstance(s, str) else s.get('name', '') for s in s_list])}")
                else:
                    skill_lines.append(f"{domain}: {s_list}")
            chunks.append({
                "chunk_id": "skills_mastery",
                "chunk_type": "skill",
                "title": "Anees Technical Skills & Proficiency Stack",
                "keywords": "skills tech stack languages python pytorch fastapi langchain yolo docker git computer vision nlp",
                "content": "\n".join(skill_lines)
            })

        # 7. Experience Chunk
        exp = kb.get("experience", [])
        if exp:
            exp_lines = []
            for e in exp:
                exp_lines.append(f"Role: {e.get('title')} at {e.get('company', 'Independent AI Projects')} ({e.get('duration', '')}) -> {e.get('description', '')}")
            chunks.append({
                "chunk_id": "professional_experience",
                "chunk_type": "experience",
                "title": "Anees Professional AI Engineering Experience",
                "keywords": "experience work history employment career projects freelance contractor internship",
                "content": "\n".join(exp_lines)
            })

        # 8. Career Positioning Chunk
        pos = kb.get("career_positioning", {})
        if pos:
            chunks.append({
                "chunk_id": "career_positioning",
                "chunk_type": "positioning",
                "title": "Anees Career Positioning & Unique Value Proposition",
                "keywords": "career objective summary elevator pitch who is anees value proposition differentiation",
                "content": f"Elevator Pitch: {pos.get('elevator_pitch', '')}\nKey Differentiators: {', '.join(pos.get('differentiators', [])) if isinstance(pos.get('differentiators'), list) else pos.get('differentiators', '')}"
            })

        # 9. Salary & Compensation Policy Chunk
        sal = kb.get("salary_policy", {})
        if sal:
            chunks.append({
                "chunk_id": "salary_policy",
                "chunk_type": "salary",
                "title": "Salary Expectations & Compensation Discussion Policy",
                "keywords": "salary compensation hourly rate pay expected package dollars rupees money budget negotiation",
                "content": f"Salary Discussion Rule: {sal.get('rule', 'Negotiable based on role & scope')}\nExact Numbers: {sal.get('when_asked_exact', '')}"
            })

        # 10. Identity Profile & Date of Birth Chunk
        pub = kb.get("identity_public", {})
        priv = kb.get("identity_private", {})
        dob = priv.get("dob", "2002-07-25")
        chunks.append({
            "chunk_id": "identity_and_demographics",
            "chunk_type": "identity",
            "title": "Anees Identity, Demographics, Age & Date of Birth (DOB)",
            "keywords": f"dob bd birthday date of birth born birthdate age {dob} July 25 2002 name who is anees introduce yourself introduction executive bio education degree university",
            "content": f"Name: {pub.get('name', 'Anees Munir Khokhar')}\nRole: {pub.get('role', 'AI Engineer')}\nLocation: {pub.get('location', 'Islamabad, Pakistan')}\nDate of Birth (DOB/BD): {dob} (born July 25, 2002, currently 23 years old)\nEducation: {pub.get('education', {}).get('degree', 'BS AI')} from {pub.get('education', {}).get('university', 'UAJK')}"
        })

        # 11. Master Portfolio Overview Chunk (All 8 Projects Summary & Count)
        summary = kb.get("portfolio_summary", {})
        if summary:
            p_lines = []
            for cat, desc in summary.get("all_projects_by_category", {}).items():
                p_lines.append(f"- **{cat}**: {desc}")
            chunks.append({
                "chunk_id": "master_portfolio_overview",
                "chunk_type": "portfolio_overview",
                "title": "Master Engineering Portfolio Summary & All 8 Projects Overview",
                "keywords": "how many projects list of projects all projects total projects projects summary full list projects count 8 projects portfolio",
                "content": f"Total Projects Count: 8 Production-Grade Projects\nOverview Statement: {summary.get('overview_statement', '')}\n\nFull List of 8 Projects by Category:\n" + "\n".join(p_lines)
            })

        return chunks


class PurePythonHybridIndexer:
    """Zero-dependency deterministic BM25 + TF-IDF Hybrid Indexer fallback."""
    def __init__(self, chunks: List[Dict[str, Any]]):
        self.chunks = chunks
        self.doc_freqs = {}
        self.num_docs = len(chunks)
        self.avg_doc_len = 0.0
        self.doc_lengths = []
        self.tokenized_docs = []
        self.doc_term_counts_list = []

        total_len = 0
        for chunk in chunks:
            text = f"{chunk['title']} {chunk['keywords']} {chunk['content']}".lower()
            tokens = re.findall(r'\w+', text)
            self.tokenized_docs.append(tokens)
            doc_len = len(tokens)
            self.doc_lengths.append(doc_len)
            total_len += doc_len

            term_counts = {}
            for t in tokens:
                term_counts[t] = term_counts.get(t, 0) + 1
            self.doc_term_counts_list.append(term_counts)

            seen = set(tokens)
            for t in seen:
                self.doc_freqs[t] = self.doc_freqs.get(t, 0) + 1

        self.avg_doc_len = total_len / max(1, self.num_docs)

    def search(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        query_tokens = re.findall(r'\w+', query.lower())
        if not query_tokens:
            return self.chunks[:top_k]

        scores = []
        k1 = 1.5
        b = 0.75

        for idx, doc_term_counts in enumerate(self.doc_term_counts_list):
            doc_len = self.doc_lengths[idx]
            score = 0.0

            for qt in query_tokens:
                if qt in doc_term_counts:
                    tf = doc_term_counts[qt]
                    df = self.doc_freqs.get(qt, 0)
                    idf = math.log((self.num_docs - df + 0.5) / (df + 0.5) + 1.0)
                    if idf < 0:
                        idf = 0.01
                    bm25_tf = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (doc_len / max(1, self.avg_doc_len))))
                    score += idf * bm25_tf

            scores.append((score, idx))

        scores.sort(key=lambda x: x[0], reverse=True)
        results = []
        for score, idx in scores[:top_k]:
            chunk_copy = dict(self.chunks[idx])
            chunk_copy["score"] = float(score)
            results.append(chunk_copy)
        return results


class HybridVectorStore:
    """Multi-tier RAG Indexer: tries FAISS -> tries Scikit-Learn -> falls back to PurePython BM25."""
    def __init__(self, chunks: List[Dict[str, Any]]):
        self.chunks = chunks
        self.engine_type = "PurePythonBM25"
        self.indexer = None
        self.vectorizer = None
        self.tfidf_matrix = None
        self.faiss_index = None
        self.embedding_model = None

        if not chunks:
            return

        # Tier 1: FAISS Dense Embeddings (if available)
        if FAISS_AVAILABLE:
            try:
                self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
                texts = [f"{c['title']} {c['keywords']} {c['content']}" for c in chunks]
                embeddings = self.embedding_model.encode(texts, normalize_embeddings=True)
                dim = embeddings.shape[1]
                self.faiss_index = faiss.IndexFlatIP(dim)
                self.faiss_index.add(embeddings)
                self.engine_type = "FAISS_Dense"
                print("[RAG Engine] Initialized with FAISS Dense Vector Indexer (dim=384).")
                return
            except Exception as e:
                print(f"[WARNING] FAISS initialization skipped ({str(e)[:100]}). Falling back to Scikit-Learn...")

        # Tier 2: Scikit-Learn TF-IDF Cosine Similarity (if available)
        if SKLEARN_AVAILABLE:
            try:
                self.vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
                texts = [f"{c['title']} {c['keywords']} {c['content']}" for c in chunks]
                self.tfidf_matrix = self.vectorizer.fit_transform(texts)
                self.engine_type = "ScikitLearn_TfidfCosine"
                print("[RAG Engine] Initialized with Scikit-Learn TF-IDF Cosine Vectorizer.")
                return
            except Exception as e:
                print(f"[WARNING] Scikit-Learn initialization skipped ({str(e)[:100]}). Falling back to PurePython BM25...")

        # Tier 3: Pure Python BM25 Hybrid Indexer
        self.indexer = PurePythonHybridIndexer(chunks)
        self.engine_type = "PurePythonBM25"
        print("[RAG Engine] Initialized with zero-dependency PurePython BM25 Indexer.")

    def search(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        if not self.chunks or not query.strip():
            return self.chunks[:top_k] if self.chunks else []

        if self.engine_type == "FAISS_Dense" and self.faiss_index is not None:
            try:
                q_emb = self.embedding_model.encode([query], normalize_embeddings=True)
                scores, indices = self.faiss_index.search(q_emb, min(top_k, len(self.chunks)))
                results = []
                for idx_in_arr, chunk_idx in enumerate(indices[0]):
                    if chunk_idx >= 0 and chunk_idx < len(self.chunks):
                        c = dict(self.chunks[chunk_idx])
                        c["score"] = float(scores[0][idx_in_arr])
                        results.append(c)
                return results
            except Exception as e:
                print(f"[WARNING] FAISS search failed: {e}. Switching search engine...")

        if self.engine_type == "ScikitLearn_TfidfCosine" and self.vectorizer is not None:
            try:
                q_vec = self.vectorizer.transform([query])
                sims = cosine_similarity(q_vec, self.tfidf_matrix).flatten()
                top_indices = sims.argsort()[::-1][:top_k]
                results = []
                for idx in top_indices:
                    c = dict(self.chunks[idx])
                    c["score"] = float(sims[idx])
                    results.append(c)
                return results
            except Exception as e:
                print(f"[WARNING] Scikit-Learn search failed: {e}. Switching search engine...")

        # Fallback to PurePython BM25
        if self.indexer is None:
            self.indexer = PurePythonHybridIndexer(self.chunks)
        return self.indexer.search(query, top_k=top_k)


class RAGEngine:
    """Singleton facade coordinating KnowledgeChunker and HybridVectorStore for app.py integration."""
    _instance: Optional["RAGEngine"] = None

    def __init__(self, kb_dict: Dict[str, Any]):
        self.chunks = KnowledgeChunker.chunk_knowledge_base(kb_dict)
        self.store = HybridVectorStore(self.chunks)
        self._query_cache: Dict[str, List[Dict[str, Any]]] = {}
        self._cache_max = 64
        print(f"[OK] RAGEngine live: indexed {len(self.chunks)} semantic documents via [{self.store.engine_type}].")

    @classmethod
    def get_instance(cls, kb_dict: Optional[Dict[str, Any]] = None) -> "RAGEngine":
        if cls._instance is None and kb_dict is not None:
            cls._instance = cls(kb_dict)
        return cls._instance

    def retrieve(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        cache_key = f"{query.strip().lower()}|{top_k}"
        if cache_key in self._query_cache:
            return self._query_cache[cache_key]
        results = self.store.search(query, top_k=top_k)
        if len(self._query_cache) >= self._cache_max:
            oldest = next(iter(self._query_cache))
            del self._query_cache[oldest]
        self._query_cache[cache_key] = results
        return results
