/**
 * ANEES MUNIR KHOKHAR — AI PORTFOLIO DASHBOARD
 * Vanilla JS: Modal system, Ask routing, keyboard & backdrop close
 */

document.addEventListener('DOMContentLoaded', () => {
  initCardModals();
  initAskRouting();
  initModalClose();
});

/* ── References ─────────────────────────────────────────────────────────── */
const overlay = document.getElementById('modalOverlay');
const shell   = document.getElementById('modalShell');
const body    = document.getElementById('modalBody');
const closeBtn= document.getElementById('modalClose');

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
function initAskRouting() {
  const form  = document.getElementById('askForm');
  const input = document.getElementById('askInput');
  if (!form || !input) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim().toLowerCase();
    if (!q) return;

    if (hit(q, ['resume','cv','download','pdf'])) {
      openModal('resume');
      return;
    }

    let target = 'me'; // default

    if      (hit(q, ['project','projects','work','portfolio','apps','build','built']))         target = 'projects';
    else if (hit(q, ['skill','skills','technology','tech stack','tools','backend','database','devops'])) target = 'skills';
    else if (hit(q, ['fun','hobbies','hobby','interests','travel','hiking','cooking',
                      'badminton','gardening','reading','mother']))                             target = 'fun';
    else if (hit(q, ['contact','email','phone','linkedin','hire']))                            target = 'contact';
    else if (hit(q, ['about','me','profile','who are you','information','bio','intro']))        target = 'me';

    openModal(target);
  });

  function hit(str, words) {
    return words.some(w => str.includes(w));
  }
}

/* ── 3. CLOSE MODAL LOGIC ───────────────────────────────────────────────── */
function initModalClose() {
  // Close button
  closeBtn.addEventListener('click', closeModal);

  // Click backdrop (outside modal-shell)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeModal();
    }
  });
}

/* ── OPEN / CLOSE HELPERS ───────────────────────────────────────────────── */
function openModal(id) {
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
}

function closeModal() {
  overlay.classList.remove('open');
  document.body.classList.remove('modal-open');
  shell.removeAttribute('data-active');

  // Clear content after animation finishes
  setTimeout(() => { body.innerHTML = ''; }, 350);
}

/* ── EVENT DELEGATION & PARALLAX ────────────────────────────────────────── */
// Event delegation for copy buttons inside modals
body.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  const val = btn.getAttribute('data-copy');
  if (val) copyToClipboard(val, btn);
});

// Subtle desktop mouse parallax on background word
window.addEventListener('mousemove', (e) => {
  const bgWord = document.getElementById('bgWord');
  if (!bgWord || window.innerWidth <= 700) return;
  const x = (e.clientX / window.innerWidth - 0.5) * 22; // -11px to +11px
  const y = (e.clientY / window.innerHeight - 0.5) * 16; // -8px to +8px
  requestAnimationFrame(() => {
    bgWord.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0)`;
  });
});

/* ── SAAS COPY TO CLIPBOARD HELPER ──────────────────────────────────────── */
window.copyToClipboard = function(text, btn) {
  if (!text || !btn) return;

  const copyAction = () => {
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
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(copyAction).catch(() => fallbackCopy(text, copyAction));
  } else {
    fallbackCopy(text, copyAction);
  }
};

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
