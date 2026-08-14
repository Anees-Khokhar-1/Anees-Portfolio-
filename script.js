/**
 * ANEES MUNIR KHOKHAR — AI PORTFOLIO DASHBOARD
 * Vanilla JS: Modal system, Ask routing, Toast notifications, keyboard & backdrop close
 */

document.addEventListener('DOMContentLoaded', () => {
  initCardModals();
  initAskRouting();
  initModalClose();
  initGlobalDelegation();
  initScrollProgress();
  initHeroVoiceRecorder();
});

/* ── HERO WHATSAPP VOICE RECORDER ─────────────────────────────────────── */
function initHeroVoiceRecorder() {
  const form = document.getElementById('askForm');
  const input = document.getElementById('askInput');
  const micBtn = document.getElementById('heroMicBtn');
  if (form && input && micBtn && window.WhatsAppVoiceRecorder) {
    new WhatsAppVoiceRecorder({
      form: form,
      input: input,
      micBtn: micBtn,
      onSend: (text) => {
        if (text) {
          window.location.href = 'chat.html?q=' + encodeURIComponent(text);
        }
      }
    });
  }
}

function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight <= 0) return;
    const progress = (window.scrollY / totalHeight) * 100;
    bar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }, { passive: true });
}

/* ── References ─────────────────────────────────────────────────────────── */
const overlay  = document.getElementById('modalOverlay');
const shell    = document.getElementById('modalShell');
const body     = document.getElementById('modalBody');
const closeBtn = document.getElementById('modalClose');

/* ── 1. OPEN MODAL BY CARD CLICK ────────────────────────────────────────── */
function initCardModals() {
  document.querySelectorAll('.dash-card[data-modal]').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-modal');
      openModal(id);
    });
  });
}

/* ── 2. ASK-ME-ANYTHING INPUT ROUTING ───────────────────────────────────── */
const ROUTE_KEYWORDS = {
  resume:   ['resume', 'cv', 'download', 'pdf'],
  projects: ['project', 'projects', 'work', 'portfolio', 'apps', 'build', 'built'],
  skills:   ['skill', 'skills', 'technology', 'tech stack', 'tools', 'backend', 'database', 'devops', 'fastapi', 'python'],
  fun:      ['fun', 'hobbies', 'hobby', 'interests', 'travel', 'hiking', 'cooking', 'badminton', 'gardening', 'reading', 'mother'],
  contact:  ['contact', 'email', 'phone', 'linkedin', 'hire'],
  me:       ['about', 'me', 'profile', 'who are you', 'information', 'bio', 'intro']
};

function initAskRouting() {
  const form  = document.getElementById('askForm');
  const input = document.getElementById('askInput');
  if (!form || !input) return;

  function hit(str, words) {
    return words.some(w => str.includes(w));
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim().toLowerCase();
    if (!q) return;

    // Natural-language questions (>3 words) always go to the AI chatbot
    const wordCount = q.split(/\s+/).length;
    if (wordCount > 3) {
      window.location.href = 'chat.html?q=' + encodeURIComponent(input.value.trim());
      return;
    }

    if (hit(q, ROUTE_KEYWORDS.resume)) {
      window.location.href = 'resume.html';
      return;
    }

    let target = null;
    for (const [route, keywords] of Object.entries(ROUTE_KEYWORDS)) {
      if (route !== 'resume' && hit(q, keywords)) {
        target = route;
        break;
      }
    }

    if (target) {
      openModal(target);
    } else {
      // Single-word or short unmatched query → route to AI Digital Twin chat
      window.location.href = 'chat.html?q=' + encodeURIComponent(input.value.trim());
    }
  });
}

/* ── 3. CLOSE MODAL LOGIC & GLOBAL DELEGATION ────────────────────────────── */
function initModalClose() {
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal(true));

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(true);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) {
      closeModal(true);
    }
  });

  initDeepLinkRouting();
}

/* ── UNIVERSAL HISTORY & MODAL NAVIGATION CONTROLLER ──────────────────── */
let isModalHistoryActive = false;

function openModal(id, pushHistory = true) {
  const tpl = document.getElementById('tpl-' + id);
  if (!tpl) return;

  shell.setAttribute('data-active', id);

  // Clone template content into modal body
  body.innerHTML = '';
  body.appendChild(tpl.content.cloneNode(true));

  // Show overlay
  overlay.classList.add('open');
  document.body.classList.add('modal-open');

  // Scroll modal body to top
  body.scrollTop = 0;

  // Push history state so mobile swipe-back & browser back button close modal instead of exiting site
  if (pushHistory) {
    const hash = '#' + id;
    if (window.location.hash !== hash) {
      window.history.pushState({ modalId: id }, '', hash);
    }
    isModalHistoryActive = true;
  }
}

function closeModal(triggerHistoryBack = true) {
  if (!overlay) return;
  
  const isCurrentlyOpen = overlay.classList.contains('open');
  overlay.classList.remove('open');
  document.body.classList.remove('modal-open');
  if (shell) shell.removeAttribute('data-active');

  // Clear content after animation finishes
  setTimeout(() => { if (body && !overlay.classList.contains('open')) body.innerHTML = ''; }, 350);

  // Synchronize browser history if closed manually (X button, backdrop click, ESC key)
  if (isCurrentlyOpen && triggerHistoryBack && (isModalHistoryActive || window.location.hash)) {
    isModalHistoryActive = false;
    if (window.location.hash) {
      try {
        window.history.pushState({ modalId: null }, '', window.location.pathname);
      } catch (err) {}
    }
  }
}

// ── Handle Mobile Swipe-Back Gesture & Browser Back Button (popstate Listener) ──
window.addEventListener('popstate', (e) => {
  if (overlay && overlay.classList.contains('open')) {
    // Browser back button or mobile swipe-back popped history: close modal UI without extra history.back()
    closeModal(false);
  } else if (e.state && e.state.modalId) {
    // User navigated forward to a modal state
    openModal(e.state.modalId, false);
  }
});

// ── Deep-Linking Routing (index.html#projects, #me, #skills, #contact, #fun) ──
function initDeepLinkRouting() {
  const hash = window.location.hash.replace('#', '').trim();
  if (hash) {
    const validRoutes = ['me', 'projects', 'skills', 'fun', 'contact'];
    if (validRoutes.includes(hash)) {
      setTimeout(() => openModal(hash, false), 100);
    }
  }
}

window.openModal = openModal;
window.closeModal = closeModal;

function initGlobalDelegation() {
  document.addEventListener('click', (e) => {
    // Action delegation for data-action="close-modal"
    const closeTrigger = e.target.closest('[data-action="close-modal"], .modal-back-btn, .modal-bottom-back');
    if (closeTrigger) {
      closeModal();
      return;
    }

    // Action delegation for data-copy buttons
    const copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) {
      const val = copyBtn.getAttribute('data-copy');
      if (val) copyToClipboard(val, copyBtn);
    }
  });

  // Global submit listener for dynamic modal forms (Contact Form)
  document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'contactForm') {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector('button[type="submit"]');
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      const consent = form.consent ? form.consent.checked : false;

      if (!consent) {
        showToast('Consent is required under privacy regulations.');
        return;
      }

      const origText = btn.innerText;
      btn.disabled = true;
      btn.innerText = 'Sending...';

      try {
        const API_URL = '/api/contact';
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message, consent })
        });
        const data = await res.json();
        if (res.ok) {
          showToast('Message sent! Anees will reply shortly.');
          form.reset();
        } else {
          showToast(data.detail || 'Failed to submit form.');
        }
      } catch (err) {
        showToast('Network error — please email directly.');
      }
      btn.disabled = false;
      btn.innerText = origText;
    }
  });
}

/* ── PARALLAX EFFECT ────────────────────────────────────────────────────── */
let cachedBgWord = null;
let isParallaxTicking = false;

window.addEventListener('mousemove', (e) => {
  if (window.innerWidth <= 700) return;
  if (!cachedBgWord) {
    cachedBgWord = document.getElementById('bgWord');
    if (!cachedBgWord) return;
  }
  if (!isParallaxTicking) {
    const clientX = e.clientX;
    const clientY = e.clientY;
    requestAnimationFrame(() => {
      const x = (clientX / window.innerWidth - 0.5) * 22;
      const y = (clientY / window.innerHeight - 0.5) * 16;
      cachedBgWord.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0)`;
      isParallaxTicking = false;
    });
    isParallaxTicking = true;
  }
});

/* ── SAAS COPY TO CLIPBOARD & TOAST SYSTEM ──────────────────────────────── */
window.copyToClipboard = function(text, btn) {
  if (!text) return;

  const copyAction = () => {
    if (btn) {
      btn.classList.add('copied');
      const origHtml = btn.innerHTML;
      if (btn.classList.contains('small-copy-btn')) {
        btn.innerText = 'Copied!';
      } else {
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2.5" fill="none"><polyline points="20 6 9 17 4 12"/></svg>`;
      }

      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = origHtml;
      }, 1500);
    }
    showToast('Copied to clipboard!');
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(copyAction).catch(() => fallbackCopy(text, copyAction));
  } else {
    fallbackCopy(text, copyAction);
  }
}

function fallbackCopy(text, onSuccess) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    onSuccess();
  } catch(err) {}
  document.body.removeChild(ta);
}

function showToast(msg) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon">✓</span><span>${msg}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}
