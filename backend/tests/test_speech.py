"""
ANEES AI DIGITAL TWIN — Speech Pipeline Integration Unit Tests
Tests /api/stt and /api/tts FastAPI endpoints.
"""

import unittest
from fastapi.testclient import TestClient
from backend.app import app

class TestSpeechPipeline(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_stt_endpoint_empty_file_validation(self):
        """Verify that sending empty audio file returns 400 Bad Request."""
        res = self.client.post("/api/stt", files={"file": ("empty.webm", b"", "audio/webm")})
        self.assertEqual(res.status_code, 400)

    def test_tts_endpoint_male_voice_generation(self):
        """Verify that /api/tts returns 200 OK with audio/mpeg content type."""
        payload = {
            "text": "Hello! I am Anees's AI Digital Twin.",
            "voice": "am_adam"
        }
        res = self.client.post("/api/tts", json=payload)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers["content-type"], "audio/mpeg")
        self.assertGreater(len(res.content), 100)

if __name__ == "__main__":
    unittest.main()
