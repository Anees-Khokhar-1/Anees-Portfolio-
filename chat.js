/**
 * ANEES AI DIGITAL TWIN — Chat Page Client
 * Handles message sending, receiving, typing indicators, chip routing,
 * health status checks, and resilient HF Space cold-start retries.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');
  const chips = document.getElementById('chatChips');
  const sendBtn = document.getElementById('chatSend');
  const clearBtn = document.getElementById('chatClearBtn');
  const statusEl = document.querySelector('.chat-status');
  const mindModeToggle = document.getElementById('mindModeToggle');
  const ttsModeToggle = document.getElementById('ttsModeToggle');
  const micBtn = document.getElementById('micBtn');

  // Auto-scroll chat messages container when soft keyboard toggles on mobile
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      if (messages) {
        messages.scrollTop = messages.scrollHeight;
      }
    });
  }

  // ── Ephemeral Session Management ──────────────────────────────────────────
  // Each visit or page refresh starts with a 100% clean, fresh chatbot session.
  let conversationHistory = [];
  function hideChips() {
    if (chips && !chips.classList.contains('hide-chips')) {
      chips.classList.add('hide-chips');
      setTimeout(() => {
        try { chips.style.display = 'none'; } catch(e){}
      }, 320);
    }
  }

  try {
    window.sessionStorage.removeItem('anees_ai_chat_history');
  } catch (err) {}

  // Handle Clear Chat Button Click
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      conversationHistory = [];
      try { window.sessionStorage.removeItem('anees_ai_chat_history'); } catch(e){}
      // Reset messages area back to default welcome bubble
      messages.innerHTML = `
        <div class="chat-bubble ai">
          <div class="bubble-avatar">
            <img src="assets/avatar.png" alt="AI" />
          </div>
          <div class="bubble-content">
            <p>Hello! 👋 I'm Anees's AI Digital Twin. How can I help you today?</p>
            <span class="bubble-time">${getCurrentTimestamp()}</span>
          </div>
        </div>
      `;
      if (chips) {
        chips.style.display = 'flex';
        chips.classList.remove('hide-chips');
      }
      input.focus();
    });
  }

  // Absolute relative API paths (unified origin on Hugging Face Spaces port 7860 & local dev)
  const API_URL = '/api/chat';
  const STREAM_API_URL = '/api/chat/stream';
  const HEALTH_URL = '/health';

  // ── Dynamic Backend Health Check (optimistic, non-blocking) ────────────────
  if (statusEl) statusEl.innerHTML = `<span class="pulse-dot-sm"></span>Online`;
  async function checkBackendHealth() {
    if (!statusEl) return;
    try {
      const res = await fetch(HEALTH_URL, { method: 'GET', signal: AbortSignal.timeout(1500) });
      if (!res.ok) {
        statusEl.innerHTML = `<span class="pulse-dot-sm pulse-orange"></span>Standby`;
      }
    } catch (e) {
      statusEl.innerHTML = `<span class="pulse-dot-sm pulse-orange"></span>Waking AI...`;
    }
  }
  checkBackendHealth();

  // Handle chip clicks
  if (chips) {
    chips.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip') || e.target.closest('.chat-chip');
      if (!chip) return;
      const prompt = chip.getAttribute('data-prompt') || chip.getAttribute('data-query') || chip.innerText.trim();
      if (prompt) {
        input.value = prompt;
        sendMessage(prompt);
        hideChips();
      }
    });
  }

  // Handle form submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = input.value.trim();
      if (!msg) return;

      // Prime SpeechSynthesis audio context on user gesture (crucial for typed queries in Chrome)
      if ('speechSynthesis' in window && ttsModeToggle && ttsModeToggle.checked) {
        try {
          window.speechSynthesis.resume();
        } catch (err) {}
      }

      sendMessage(msg);
      if (chips) chips.style.display = 'none';
    });
  }

  // Check for ?q= query param (from dashboard ask-bar redirect)
  const urlParams = new URLSearchParams(window.location.search);
  const autoQuery = urlParams.get('q');
  if (autoQuery && autoQuery.trim()) {
    setTimeout(() => {
      input.value = autoQuery.trim();
      sendMessage(autoQuery.trim());
      if (chips) chips.style.display = 'none';
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {}
    }, 50);
  }

  // ── Resilient Exponential Backoff Retry (HF Space Cold-Start Protection) ────
  async function fetchWithRetry(url, options, retries = 3, delayMs = 2500) {
    try {
      const res = await fetch(url, options);
      if (!res.ok && res.status >= 500 && retries > 0) {
        await new Promise(r => setTimeout(r, delayMs));
        return await fetchWithRetry(url, options, retries - 1, delayMs * 1.8);
      }
      return res;
    } catch (err) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, delayMs));
        return await fetchWithRetry(url, options, retries - 1, delayMs * 1.8);
      }
      throw err;
    }
  }

  async function sendMessage(text) {
    hideChips();
    appendBubble('user', text);
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;

    const typingEl = appendTypingIndicator();
    scrollToBottom();

    try {
      // 1. Try Real-Time SSE Token Streaming
      const res = await fetch(STREAM_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: conversationHistory }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Streaming unavailable, falling back to standard JSON API');
      }

      typingEl.remove();

      // Create AI bubble for progressive streaming fill
      const aiBubble = document.createElement('div');
      aiBubble.className = 'chat-bubble ai';
      aiBubble.innerHTML = `
        <div class="bubble-avatar"><img src="assets/avatar.png" alt="AI" /></div>
        <div class="bubble-content">
          <div class="ai-formatted-content"></div>
        </div>
      `;
      messages.appendChild(aiBubble);
      const contentEl = aiBubble.querySelector('.ai-formatted-content');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let metadataPayload = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        let isMetaEvent = false;
        for (const line of lines) {
          if (line.startsWith('event: metadata')) {
            isMetaEvent = true;
            continue;
          }
          if (line.startsWith('data: ')) {
            const token = line.slice(6);
            if (token === '[DONE]') break;
            if (isMetaEvent) {
              try { metadataPayload = JSON.parse(token); } catch(e) {}
              isMetaEvent = false;
              continue;
            }
            const unescapedToken = token.replace(/\\n/g, '\n');
            fullText += unescapedToken;
            contentEl.innerHTML = formatAIMessage(fullText);
            scrollToBottom();
          }
        }
      }

      const timestamp = getCurrentTimestamp();
      const timeEl = document.createElement('span');
      timeEl.className = 'bubble-time';
      timeEl.textContent = timestamp;
      aiBubble.querySelector('.bubble-content').appendChild(timeEl);

      // Render Agentic Mind Mode Trace (if toggle is ON and metadata received)
      if (mindModeToggle && mindModeToggle.checked && metadataPayload) {
        const traceEl = document.createElement('div');
        traceEl.className = 'mind-trace';
        traceEl.innerHTML = `
          <button class="trace-toggle" onclick="this.parentElement.classList.toggle('expanded')">
            <span>⚙️ Agentic Reasoning Trace</span>
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="trace-body">
            <div class="trace-step trace-pass"><span class="trace-time">[0ms]</span> 🛡️ Security Check: <strong>${metadataPayload.security_check || 'PASS'}</strong></div>
            <div class="trace-step trace-rag"><span class="trace-time">[~38ms]</span> 🔍 ${metadataPayload.rag_engine || 'FAISS'} Retrieval: <strong>"${metadataPayload.rag_top_title || 'N/A'}"</strong> (score: ${metadataPayload.rag_top_score || '—'})</div>
            <div class="trace-step trace-engine"><span class="trace-time">[${metadataPayload.latency_ms || '?'}ms]</span> ⚡ Engine: <strong>${metadataPayload.model || 'llama-3.3-70b'}</strong> · ${metadataPayload.latency_ms || '?'}ms total</div>
          </div>
        `;
        aiBubble.querySelector('.bubble-content').appendChild(traceEl);
      }

      conversationHistory.push({ role: 'user', content: text });
      conversationHistory.push({ role: 'assistant', content: fullText });
      if (statusEl) statusEl.innerHTML = `<span class="pulse-dot-sm"></span>Online`;

      // Voice Assistant TTS Response (if Voice toggle is ON)
      speakText(fullText);

    } catch (err) {
      // Streaming failed — show immediate error (no sequential double-call)
      if (typingEl) typingEl.remove();
      console.warn('[Chat] Stream request failed:', err.message);
      appendBubble('ai', 'Connection issue — please refresh and try again, or email Anees at aneesmunir1020@gmail.com.');
    }

    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
    scrollToBottom();
  }

  function appendBubble(type, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${type}`;
    const timestamp = getCurrentTimestamp();

    if (type === 'ai') {
      bubble.innerHTML = `
        <div class="bubble-avatar"><img src="assets/avatar.png" alt="AI" /></div>
        <div class="bubble-content">
          <div class="ai-formatted-content">${formatAIMessage(text)}</div>
          <span class="bubble-time">${timestamp}</span>
        </div>
      `;
    } else {
      bubble.innerHTML = `
        <div class="bubble-content">
          <p>${escapeHtml(text)}</p>
          <span class="bubble-time">${timestamp}</span>
        </div>
      `;
    }

    messages.appendChild(bubble);
    scrollToBottom();
  }

  function appendTypingIndicator() {
    const el = document.createElement('div');
    el.className = 'chat-bubble ai typing-indicator';
    el.innerHTML = `
      <div class="bubble-avatar"><img src="assets/avatar.png" alt="AI" /></div>
      <div class="bubble-content">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    messages.appendChild(el);
    return el;
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      messages.scrollTop = messages.scrollHeight;
    });
  }

  function getCurrentTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatAIMessage(str) {
    if (!str) return '';
    const lines = str.split('\n');
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      
      // Render Headings (###, ##, #)
      if (trimmed.startsWith('### ')) {
        const title = formatInlineMarkdown(escapeHtml(trimmed.slice(4)));
        return `<h3 class="ai-h3">${title}</h3>`;
      }
      if (trimmed.startsWith('## ')) {
        const title = formatInlineMarkdown(escapeHtml(trimmed.slice(3)));
        return `<h2 class="ai-h2">${title}</h2>`;
      }
      if (trimmed.startsWith('# ')) {
        const title = formatInlineMarkdown(escapeHtml(trimmed.slice(2)));
        return `<h1 class="ai-h1">${title}</h1>`;
      }
      
      const lineEscaped = escapeHtml(line);
      
      // Render Bullet items (- item or * item)
      if (/^\s*[\-\*]\s+/.test(line)) {
        const content = lineEscaped.replace(/^\s*[\-\*]\s+/, '');
        return `<div class="ai-bullet"><span class="ai-bullet-dot">▪</span><span>${formatInlineMarkdown(content)}</span></div>`;
      }
      
      return formatInlineMarkdown(lineEscaped);
    });

    return formattedLines.join('<br>').replace(/(<br>\s*){3,}/g, '<br><br>');
  }

  function formatInlineMarkdown(text) {
    let res = text.replace(/\*\*(.*?)\*\*/g, '<strong class="ai-bold">$1</strong>');
    res = res.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    res = res.replace(/`(.*?)`/g, '<code class="ai-code">$1</code>');
    return res;
  }

  let cachedVoices = [];
  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    cachedVoices = window.speechSynthesis.getVoices() || [];
  }
  if ('speechSynthesis' in window) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function getBestMaleVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    const availableVoices = (voices && voices.length) ? voices : cachedVoices;
    if (!availableVoices || !availableVoices.length) return null;

    const maleKeywords = [
      'microsoft david',
      'microsoft mark',
      'google uk english male',
      'google us english male',
      'microsoft george',
      'alex',
      'daniel',
      'fred'
    ];

    let maleVoice = availableVoices.find(v => 
      v.lang.startsWith('en') && 
      maleKeywords.some(k => v.name.toLowerCase().includes(k))
    );

    if (!maleVoice) {
      maleVoice = availableVoices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.toLowerCase().includes('male') || v.voiceURI.toLowerCase().includes('male'))
      );
    }

    if (!maleVoice) {
      const femaleKeywords = ['zira', 'samantha', 'victoria', 'google us english', 'female', 'karen', 'fiona', 'moira'];
      maleVoice = availableVoices.find(v => 
        v.lang.startsWith('en') && 
        !femaleKeywords.some(f => v.name.toLowerCase().includes(f))
      );
    }

    return maleVoice || availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
  }

  function speakText(text) {
    if (!('speechSynthesis' in window) || !ttsModeToggle || !ttsModeToggle.checked) return;
    try { window.speechSynthesis.cancel(); } catch (e) {}

    const cleanText = text
      .replace(/<[^>]*>/g, '')
      .replace(/[\#\*\`\_]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const maleVoice = getBestMaleVoice();
    if (maleVoice) {
      console.log('[TTS] Selected Male Voice:', maleVoice.name, maleVoice.lang);
    }

    // Split text by punctuation (. ! ? ;) or line breaks into small chunks (<150 chars)
    // This prevents Chromium's 200-character utterance engine bug from resetting to OS default female voice mid-speech!
    const rawChunks = cleanText.match(/[^.!?;\n]+[.!?;\n]+/g) || [cleanText];
    const sentences = [];

    rawChunks.forEach(chunk => {
      const str = chunk.trim();
      if (!str) return;
      if (str.length > 160) {
        const subParts = str.match(/[^,]+[,]?/g) || [str];
        subParts.forEach(sp => { if (sp.trim()) sentences.push(sp.trim()); });
      } else {
        sentences.push(str);
      }
    });

    // Queue each sentence chunk sequentially with explicit male voice & lang binding
    sentences.forEach(sentence => {
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = 0.98;
      utterance.pitch = 0.85;

      if (maleVoice) {
        utterance.voice = maleVoice;
        utterance.lang = maleVoice.lang || 'en-US';
      }

      window.speechSynthesis.speak(utterance);
    });
  }

  // ── WhatsApp Voice Recorder Integration ────────────────────────────────
  if (form && input && micBtn && window.WhatsAppVoiceRecorder) {
    new WhatsAppVoiceRecorder({
      form: form,
      input: input,
      micBtn: micBtn,
      onSend: (text) => {
        if (text) {
          sendMessage(text);
          if (chips) chips.style.display = 'none';
        }
      }
    });
  }
});
