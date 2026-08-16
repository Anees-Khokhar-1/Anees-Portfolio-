"""
ANEES AI DIGITAL TWIN — Text-to-Speech (TTS) Engine
Powered by Kokoro-82M Neural Male Voice (am_adam / am_michael primary)
with resilient fallback to Microsoft Edge-TTS (en-US-ChristopherNeural).
Generates human-like, high-EQ male audio responses (.mp3 stream).
"""

import os
import io
import time
import logging
import asyncio
from typing import Optional

logger = logging.getLogger("ai_digital_twin.tts")

class TTSEngine:
    def __init__(self):
        self.kokoro_pipeline = None
        self.default_male_voice = "am_adam"

    def _init_kokoro(self):
        if self.kokoro_pipeline is None:
            try:
                from kokoro_onnx import Kokoro
                logger.info("[TTSEngine] Initializing Kokoro-82M Neural TTS Engine...")
                model_path = os.environ.get("KOKORO_MODEL_PATH", "kokoro-v1.0.onnx")
                voices_path = os.environ.get("KOKORO_VOICES_PATH", "voices.bin")
                
                if os.path.exists(model_path) and os.path.exists(voices_path):
                    self.kokoro_pipeline = Kokoro(model_path, voices_path)
                    logger.info("[TTSEngine] Kokoro-82M initialized successfully.")
                else:
                    logger.info("[TTSEngine] Local Kokoro ONNX model files not found, will use Edge-TTS Male Voice fallback.")
            except Exception as err:
                logger.warning(f"[TTSEngine] Kokoro TTS init error: {err}. Edge-TTS fallback active.")

    async def generate_speech_bytes(self, text: str, voice: str = "am_adam") -> bytes:
        """
        Generate MP3/WAV audio bytes for input text in male voice.
        Primary: Kokoro-82M (am_adam). Fallback: Edge-TTS (en-US-ChristopherNeural).
        """
        start_time = time.time()
        text_clean = text.strip()
        if not text_clean:
            return b""

        # 1. Try Kokoro-82M Neural Male Voice Primary
        try:
            self._init_kokoro()
            if self.kokoro_pipeline:
                selected_voice = voice if voice else self.default_male_voice
                samples, sample_rate = self.kokoro_pipeline.create(text_clean, voice=selected_voice, speed=1.0, lang="en-us")
                
                # Convert float array to WAV / MP3 bytes using soundfile
                import soundfile as sf
                wav_io = io.BytesIO()
                sf.write(wav_io, samples, sample_rate, format='WAV')
                audio_bytes = wav_io.getvalue()
                elapsed = int((time.time() - start_time) * 1000)
                logger.info(f"[TTSEngine] Kokoro Male Voice ({selected_voice}) generated in {elapsed}ms ({len(audio_bytes)} bytes)")
                return audio_bytes
        except Exception as err:
            logger.warning(f"[TTSEngine] Kokoro TTS synthesis error: {err}. Trying Edge-TTS fallback...")

        # 2. Resilient Edge-TTS Microsoft Male Voice Fallback (en-US-ChristopherNeural / Guy / Ryan / William)
        male_edge_voices = [
            "en-US-ChristopherNeural",
            "en-US-GuyNeural",
            "en-GB-RyanNeural",
            "en-AU-WilliamNeural"
        ]
        
        try:
            import edge_tts
            for edge_voice in male_edge_voices:
                try:
                    communicate = edge_tts.Communicate(text_clean, edge_voice)
                    mp3_io = io.BytesIO()
                    async for chunk in communicate.stream():
                        if chunk["type"] == "audio":
                            mp3_io.write(chunk["data"])
                    audio_bytes = mp3_io.getvalue()
                    if audio_bytes and len(audio_bytes) > 200:
                        elapsed = int((time.time() - start_time) * 1000)
                        logger.info(f"[TTSEngine] Edge-TTS Male Voice ({edge_voice}) generated in {elapsed}ms ({len(audio_bytes)} bytes)")
                        return audio_bytes
                except Exception as ve:
                    logger.warning(f"[TTSEngine] Edge-TTS voice {edge_voice} failed: {ve}. Trying next male voice...")
        except Exception as err:
            logger.error(f"[TTSEngine] Edge-TTS error: {err}")

        logger.error("[TTSEngine] All male TTS engines failed to generate audio stream.")
        return b""

# Global Singleton Instance
tts_engine = TTSEngine()
