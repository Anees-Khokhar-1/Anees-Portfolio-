/**
 * WHATSAPP-STYLE VOICE RECORDING SYSTEM — Hardened Production Edition
 * Real-time audio waveform visualizer (Web Audio API) + Web Speech API (STT)
 * Features:
 *  - 4-State Visual Machine: IDLE ➔ LISTENING ➔ THINKING ➔ SPEAKING
 *  - Ghost Live Transcript Preview Overlay
 *  - SVG Circular Silence Countdown Ring
 *  - Instant TTS Interruption on Mic Tap
 *  - Keyboard Hotkeys (Spacebar / Ctrl+Shift+V)
 *  - Mic Permission Error & Retry Toast
 */

class WhatsAppVoiceRecorder {
  constructor(config) {
    this.form = config.form;
    this.input = config.input;
    this.micBtn = config.micBtn;
    this.onSend = config.onSend;

    if (!this.form || !this.input || !this.micBtn) return;

    this.state = 'idle'; // 'idle' | 'listening' | 'thinking' | 'speaking'
    this.isRecording = false;
    this.audioCtx = null;
    this.analyser = null;
    this.micStream = null;
    this.animId = null;
    this.recognition = null;
    this.timerId = null;
    this.silenceTimerId = null;
    this.silenceCountdownInterval = null;
    this.silenceTimeLeft = 4.0;
    this.startTime = 0;
    this.transcriptText = '';

    this.buildVoiceBarUI();
    this.initSpeechRecognition();
    this.bindEvents();
    this.bindGlobalHotkeys();
  }

  buildVoiceBarUI() {
    this.voiceBar = document.createElement('div');
    this.voiceBar.className = 'whatsapp-voice-bar state-idle';
    this.voiceBar.style.display = 'none';

    this.voiceBar.innerHTML = `
      <div class="vbar-left">
        <div class="vbar-ring-wrap">
          <svg class="vbar-countdown-svg" viewBox="0 0 36 36">
            <path class="vbar-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path class="vbar-circle-progress" stroke-dasharray="100, 100" stroke-dashoffset="0" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <span class="vbar-rec-dot"></span>
        </div>
        <div class="vbar-timer-wrap">
          <span class="vbar-timer">0:00</span>
          <span class="vbar-status-text">LISTENING</span>
        </div>
      </div>
      <div class="vbar-wave-container">
        <div class="vbar-wave-bar"></div>
        <div class="vbar-wave-bar"></div>
        <div class="vbar-wave-bar"></div>
        <div class="vbar-wave-bar"></div>
        <div class="vbar-wave-bar"></div>
        <div class="vbar-wave-bar"></div>
        <div class="vbar-wave-bar"></div>
        <div class="vbar-wave-bar"></div>
        <div class="vbar-wave-bar"></div>
        <div class="vbar-wave-bar"></div>
        <div class="vbar-wave-bar"></div>
        <div class="vbar-wave-bar"></div>
      </div>
      <div class="vbar-actions">
        <button type="button" class="vbar-btn vbar-cancel" title="Cancel recording (Esc)" aria-label="Cancel recording">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <button type="button" class="vbar-btn vbar-send" title="Send voice message" aria-label="Send voice message">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <!-- Live Ghost Transcript Preview Overlay -->
      <div class="vbar-ghost-text" id="vbarGhostText" style="display:none;">Listening for your speech...</div>
    `;

    this.form.style.position = 'relative';
    this.form.appendChild(this.voiceBar);

    this.timerEl = this.voiceBar.querySelector('.vbar-timer');
    this.statusTextEl = this.voiceBar.querySelector('.vbar-status-text');
    this.ghostTextEl = this.voiceBar.querySelector('#vbarGhostText');
    this.progressCircle = this.voiceBar.querySelector('.vbar-circle-progress');
    this.waveBars = Array.from(this.voiceBar.querySelectorAll('.vbar-wave-bar'));
    this.cancelBtn = this.voiceBar.querySelector('.vbar-cancel');
    this.sendBtn = this.voiceBar.querySelector('.vbar-send');
  }

  setState(newState) {
    this.state = newState;
    this.voiceBar.classList.remove('state-idle', 'state-listening', 'state-thinking', 'state-speaking');
    this.micBtn.classList.remove('state-idle', 'state-listening', 'state-thinking', 'state-speaking', 'recording-active');

    this.voiceBar.classList.add(`state-${newState}`);
    this.micBtn.classList.add(`state-${newState}`);

    if (newState === 'listening') {
      this.micBtn.classList.add('recording-active');
      this.statusTextEl.textContent = 'LISTENING';
    } else if (newState === 'thinking') {
      this.statusTextEl.textContent = 'AI THINKING...';
    } else if (newState === 'speaking') {
      this.statusTextEl.textContent = 'AI SPEAKING';
    } else {
      this.statusTextEl.textContent = 'IDLE';
    }
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        if (!this.isRecording) return;
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        this.transcriptText = (final || interim).trim();
        if (this.transcriptText) {
          this.input.value = this.transcriptText;
          if (this.ghostTextEl) {
            this.ghostTextEl.style.display = 'block';
            this.ghostTextEl.textContent = `🗣️ "${this.transcriptText}"`;
          }
          this.resetSilenceTimer();
        }
      };

      this.recognition.onerror = (e) => {
        console.warn('[VoiceRecorder] WebSpeech event error:', e.error);
        if (e.error === 'network' || e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          try { this.recognition.abort(); } catch (err) {}
          this.recognition = null;
        }
      };
    } else {
      console.warn('[VoiceRecorder] Web Speech API not supported in this browser.');
    }
  }

  resetSilenceTimer() {
    if (this.silenceTimerId) clearTimeout(this.silenceTimerId);
    if (this.silenceCountdownInterval) clearInterval(this.silenceCountdownInterval);

    this.silenceTimeLeft = 1.8;
    this.updateSilenceProgressRing(100);

    const startTime = Date.now();
    this.silenceCountdownInterval = setInterval(() => {
      const elapsedSec = (Date.now() - startTime) / 1000;
      this.silenceTimeLeft = Math.max(0, 1.8 - elapsedSec);
      const percent = (this.silenceTimeLeft / 1.8) * 100;
      this.updateSilenceProgressRing(percent);
    }, 50);

    this.silenceTimerId = setTimeout(() => {
      if (this.isRecording && this.transcriptText) {
        this.stopAndSend();
      }
    }, 1800);
  }

  updateSilenceProgressRing(percent) {
    if (this.progressCircle) {
      const offset = 100 - Math.max(0, Math.min(100, percent));
      this.progressCircle.setAttribute('stroke-dashoffset', offset);
    }
  }

  playBeep(freq = 880, duration = 0.08) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  bindEvents() {
    const handleMicTap = (e) => {
      if (e.type === 'click') {
        e.preventDefault();
      }
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      if (!this.isRecording) {
        this.startRecording();
      } else {
        this.stopAndSend();
      }
    };

    this.micBtn.addEventListener('click', handleMicTap);
    this.micBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleMicTap(e);
    });

    this.cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.cancelRecording();
    });

    this.sendBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.stopAndSend();
    });

    this.form.addEventListener('submit', () => {
      if (this.isRecording) {
        this.stopAudioResources();
        this.transcriptText = '';
        this.input.value = '';
      }
    });
  }

  bindGlobalHotkeys() {
    document.addEventListener('keydown', (e) => {
      // Spacebar hotkey (only when activeElement is body or not an input/textarea)
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInputFocused = activeTag === 'input' || activeTag === 'textarea' || document.activeElement.isContentEditable;

      if ((e.code === 'Space' && !isInputFocused) || (e.ctrlKey && e.shiftKey && e.code === 'KeyV')) {
        e.preventDefault();
        if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
        if (!this.isRecording) {
          this.startRecording();
        } else {
          this.stopAndSend();
        }
      } else if (e.key === 'Escape' && this.isRecording) {
        e.preventDefault();
        this.cancelRecording();
      }
    });
  }

  async startRecording() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.isRecording = true;
      this.transcriptText = '';
      this.audioChunks = [];
      this.setState('listening');
      
      this.playBeep(880, 0.09);

      // Start HTML5 MediaRecorder (universal support on iPhone iOS Safari & Android Chrome)
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
        if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
        else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
      }
      
      if (typeof MediaRecorder !== 'undefined') {
        this.mediaRecorder = new MediaRecorder(this.micStream, { mimeType });
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this.audioChunks.push(e.data);
          }
        };
        this.mediaRecorder.start(200);
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }
      
      const source = this.audioCtx.createMediaStreamSource(this.micStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      this.voiceBar.style.display = 'flex';
      if (this.ghostTextEl) {
        this.ghostTextEl.style.display = 'block';
        this.ghostTextEl.textContent = 'Listening for your speech...';
      }

      this.startTime = Date.now();
      this.updateTimer();
      this.timerId = setInterval(() => this.updateTimer(), 1000);

      this.visualize();

      if (this.recognition) {
        try { this.recognition.start(); } catch (err) {}
      }

    } catch (err) {
      console.error('[VoiceRecorder] Could not access microphone:', err);
      this.showPermissionErrorToast();
    }
  }

  showPermissionErrorToast() {
    const toast = document.createElement('div');
    toast.className = 'toast show toast-error';
    toast.innerHTML = `
      <span class="toast-icon">🎙️</span>
      <span>Microphone permission required for Voice Assistant. Please check browser settings.</span>
      <button class="toast-retry-btn" onclick="this.parentElement.remove(); window.location.reload();">Retry 🔄</button>
    `;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 6000);
  }

  updateTimer() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    this.timerEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  visualize() {
    if (!this.isRecording || !this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    this.waveBars.forEach((bar, idx) => {
      const val = dataArray[idx % dataArray.length] || 0;
      const heightPercent = Math.max(15, Math.min(100, (val / 255) * 100));
      bar.style.height = `${heightPercent}%`;
    });

    this.animId = requestAnimationFrame(() => this.visualize());
  }

  stopAudioResources() {
    this.isRecording = false;

    if (this.timerId) clearInterval(this.timerId);
    if (this.silenceTimerId) clearTimeout(this.silenceTimerId);
    if (this.silenceCountdownInterval) clearInterval(this.silenceCountdownInterval);
    if (this.animId) cancelAnimationFrame(this.animId);

    if (this.recognition) {
      try {
        this.recognition.onresult = null;
        this.recognition.stop();
      } catch (e) {}
      // Re-initialize speech recognition instance for next session
      this.initSpeechRecognition();
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }

    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch (e) {}
      this.audioCtx = null;
    }

    this.voiceBar.style.display = 'none';
    if (this.ghostTextEl) this.ghostTextEl.style.display = 'none';
    this.setState('idle');
  }

  cancelRecording() {
    this.playBeep(440, 0.08);
    this.stopAudioResources();
    this.transcriptText = '';
    this.input.value = '';
  }

  stopMediaRecorderAsync() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve();
        return;
      }
      this.mediaRecorder.onstop = () => {
        resolve();
      };
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        resolve();
      }
    });
  }

  async stopAndSend() {
    this.playBeep(660, 0.08);
    this.setState('thinking');
    if (this.ghostTextEl) {
      this.ghostTextEl.textContent = 'Transcribing your speech with Whisper AI...';
    }

    if (this.recognition) {
      try {
        this.recognition.onresult = null;
        this.recognition.stop();
      } catch (e) {}
    }

    // Wait explicitly for MediaRecorder.onstop event to flush final audio data
    await this.stopMediaRecorderAsync();

    let text = (this.transcriptText || this.input.value).trim();

    // If text not captured from live WebSpeech API (Edge/Chrome), send audioBlob to /api/stt (Groq Whisper Large-v3)
    if (!text && this.audioChunks && this.audioChunks.length > 0) {
      try {
        const mimeType = (this.mediaRecorder && this.mediaRecorder.mimeType) ? this.mediaRecorder.mimeType : 'audio/webm';
        let ext = 'webm';
        if (mimeType.includes('mp4') || mimeType.includes('aac') || mimeType.includes('m4a')) ext = 'mp4';
        else if (mimeType.includes('ogg')) ext = 'ogg';
        else if (mimeType.includes('wav')) ext = 'wav';

        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        console.log('[VoiceRecorder] Captured audioBlob size:', audioBlob.size, 'mimeType:', mimeType);

        if (audioBlob.size > 300) {
          const formData = new FormData();
          formData.append('file', audioBlob, `recording.${ext}`);

          const res = await fetch('/api/stt', {
            method: 'POST',
            body: formData
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.text) {
              text = data.text;
              console.log('[VoiceRecorder] Transcribed text from /api/stt:', text);
            }
          }
        }
      } catch (err) {
        console.warn('[VoiceRecorder] STT endpoint error:', err);
      }
    }

    this.stopAudioResources();
    this.transcriptText = '';
    this.input.value = '';

    if (text) {
      if (typeof this.onSend === 'function') {
        this.onSend(text);
      }
    }
  }
}

window.WhatsAppVoiceRecorder = WhatsAppVoiceRecorder;
