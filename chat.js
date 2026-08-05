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

  // ── Ephemeral Session Management ──────────────────────────────────────────
  // Each visit or page refresh starts with a 100% clean, fresh chatbot session.
  let conversationHistory = [];
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
      if (chips) chips.style.display = 'flex';
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
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const prompt = chip.getAttribute('data-prompt');
      if (prompt) {
        input.value = prompt;
        sendMessage(prompt);
        chips.style.display = 'none'; // Hide chips after first use
      }
    });
  }

  // Handle form submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = input.value.trim();
      if (!msg) return;
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const token = line.slice(6);
            if (token === '[DONE]') break;
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

      conversationHistory.push({ role: 'user', content: text });
      conversationHistory.push({ role: 'assistant', content: fullText });
      if (statusEl) statusEl.innerHTML = `<span class="pulse-dot-sm"></span>Online`;

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
});
