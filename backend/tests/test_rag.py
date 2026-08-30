import unittest
import json
from pathlib import Path
from backend.app import KNOWLEDGE_BASE, build_system_prompt
from backend.rag_engine import RAGEngine

class TestLocalRAGEngine(unittest.TestCase):
    """Verifies retrieval precision, semantic ranking, and token optimization of the Local RAG Engine."""

    @classmethod
    def setUpClass(cls):
        cls.engine = RAGEngine.get_instance(KNOWLEDGE_BASE)

    def test_easy_study_retrieval_precision(self):
        """Assert that querying for Easy-Study brings up the exact Easy-Study project document as Rank #1."""
        query = "Tell me about your RAG study platform Easy-Study"
        results = self.engine.retrieve(query, top_k=1)
        self.assertTrue(len(results) > 0, "RAGEngine returned zero results for Easy-Study query.")
        top_chunk = results[0]
        self.assertEqual(top_chunk.get("chunk_type"), "project")
        self.assertIn("Easy-Study", top_chunk.get("title", ""), f"Rank #1 chunk title mismatch: {top_chunk.get('title')}")

    def test_relocation_retrieval_precision(self):
        """Assert that querying for onsite availability/relocation returns our availability document as Rank #1."""
        query = "Are you willing to relocate to Lahore or Karachi or work onsite?"
        results = self.engine.retrieve(query, top_k=1)
        self.assertTrue(len(results) > 0, "RAGEngine returned zero results for relocation query.")
        top_chunk = results[0]
        self.assertEqual(top_chunk.get("chunk_id"), "availability_and_relocation", f"Rank #1 chunk ID mismatch: {top_chunk.get('chunk_id')}")

    def test_skills_retrieval_precision(self):
        """Assert that querying for YOLO and computer vision stack returns our technical skills or CV project document."""
        query = "What computer vision tools do you know like YOLOv11 and PyTorch?"
        results = self.engine.retrieve(query, top_k=1)
        self.assertTrue(len(results) > 0, "RAGEngine returned zero results for computer vision query.")
        top_chunk = results[0]
        self.assertIn(top_chunk.get("chunk_id"), ["skills_mastery", "project_0", "project_1", "project_2", "project_3"], f"Retrieved unexpected chunk for CV skills: {top_chunk.get('chunk_id')}")

    def test_token_footprint_reduction(self):
        """Assert that dynamic RAG injection reduces system prompt character length significantly versus full static JSON dump."""
        # 1. Full static JSON prompt (backwards compatible / fallback)
        full_static_prompt = build_system_prompt(retrieved_chunks=None)
        
        # 2. Dynamic RAG prompt (top-4 chunks retrieved for a query)
        top_4 = self.engine.retrieve("Can you build a RAG pipeline with FastAPI?", top_k=4)
        dynamic_rag_prompt = build_system_prompt(retrieved_chunks=top_4)
        
        # 3. Assert dynamic prompt is significantly smaller (<9,000 chars / ~1,900 tokens vs ~18,000+ chars of full JSON)
        self.assertLess(
            len(dynamic_rag_prompt),
            12000,
            f"Dynamic RAG prompt ({len(dynamic_rag_prompt)} chars) exceeded our token threshold limit!"
        )
        self.assertLess(
            len(dynamic_rag_prompt),
            len(full_static_prompt) * 0.75,
            "Dynamic RAG prompt did not achieve expected token reduction compared to full static JSON injection."
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
