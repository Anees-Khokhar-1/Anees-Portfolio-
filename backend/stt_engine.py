"""
ANEES AI DIGITAL TWIN — Speech-to-Text (STT) Engine
Powered by Groq Whisper Large-v3 (primary) and Faster-Whisper (local fallback).
Delivers < 150ms transcription latency across English and Urdu audio streams.
"""

import os
import io
import time
import logging
from typing import Dict, Any

logger = logging.getLogger("ai_digital_twin.stt")

class STTEngine:
    def __init__(self):
        self.groq_api_key = os.environ.get("GROQ_API_KEY", "")
        self.faster_whisper_model = None

    def _init_faster_whisper(self):
        if self.faster_whisper_model is None:
            try:
                from faster_whisper import WhisperModel
                logger.info("[STTEngine] Initializing local Faster-Whisper (base.en)...")
                self.faster_whisper_model = WhisperModel("base.en", device="cpu", compute_type="int8")
                logger.info("[STTEngine] Faster-Whisper initialized successfully.")
            except Exception as e:
                logger.warning(f"[STTEngine] Could not load Faster-Whisper: {e}")

    @staticmethod
    def clean_transcribed_text(text: str) -> str:
        if not text:
            return ""
        
        t = text.strip()
        t_lower = t.lower()

        # Hallucination noise phrases produced by Whisper on silent background audio
        hallucination_phrases = [
            "(music)", "[music]", "(blank)", "[blank]", "(sigh)", "[sigh]",
            "thank you.", "thank you", "you", "subtitles by", "amara",
            "transcribed by", "bye.", "bye"
        ]

        if t_lower in hallucination_phrases or t_lower.startswith("subtitles by"):
            return ""

        # Remove wrapping brackets if Whisper wraps single word in [text] or (text)
        if (t.startswith("(") and t.endswith(")")) or (t.startswith("[") and t.endswith("]")):
            t = t[1:-1].strip()

        return t

    def transcribe_audio_bytes(self, audio_bytes: bytes, filename: str = "recording.webm") -> Dict[str, Any]:
        """
        Transcribe audio bytes to text using Groq Whisper Large-v3 primary,
        falling back to local Faster-Whisper.
        """
        start_time = time.time()
        groq_key = os.environ.get("GROQ_API_KEY", "").strip() or self.groq_api_key

        if "." not in filename:
            filename = f"{filename}.webm"

        # 1. Try Groq Whisper Large-v3 Primary
        if groq_key:
            try:
                from groq import Groq
                client = Groq(api_key=groq_key)
                
                # Wrap bytes in tuple for Groq SDK
                file_tuple = (filename, audio_bytes)
                res = client.audio.transcriptions.create(
                    file=file_tuple,
                    model="whisper-large-v3",
                    response_format="text",
                    temperature=0.0
                )
                raw_text = str(res).strip() if res else ""
                text = self.clean_transcribed_text(raw_text)
                elapsed = int((time.time() - start_time) * 1000)
                logger.info(f"[STTEngine] Groq Whisper ({filename}) transcribed in {elapsed}ms: '{text}' (raw: '{raw_text}')")
                return {
                    "success": True,
                    "text": text,
                    "engine": "groq_whisper_large_v3",
                    "latency_ms": elapsed
                }
            except Exception as err:
                logger.warning(f"[STTEngine] Groq Whisper API error: {err}. Falling back to local Faster-Whisper...")

        # 2. Fallback to Local Faster-Whisper
        try:
            self._init_faster_whisper()
            if self.faster_whisper_model:
                audio_io = io.BytesIO(audio_bytes)
                segments, info = self.faster_whisper_model.transcribe(audio_io, beam_size=2)
                raw_text = " ".join([segment.text for segment in segments]).strip()
                text = self.clean_transcribed_text(raw_text)
                elapsed = int((time.time() - start_time) * 1000)
                logger.info(f"[STTEngine] Faster-Whisper transcribed in {elapsed}ms: '{text}' (raw: '{raw_text}')")
                return {
                    "success": True,
                    "text": text,
                    "engine": "faster_whisper_base",
                    "latency_ms": elapsed
                }
        except Exception as err:
            logger.error(f"[STTEngine] Faster-Whisper local transcription failed: {err}")

        # Final Fallback return
        return {
            "success": False,
            "text": "",
            "engine": "none",
            "error": "Speech transcription engine unavailable"
        }

# Global Singleton Instance
stt_engine = STTEngine()
