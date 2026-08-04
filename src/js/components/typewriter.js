// ============================================================
// EXACT 1-CHARACTER-AT-A-TIME TYPEWRITER SCROLL ENGINE
// ============================================================

export function initTypewriterScroll() {
  const selectors = [
    '[data-typewriter]',
    '.typewriter-text',
    '.heading-h2',
    '.hero-title'
  ];
  
  const elements = document.querySelectorAll(selectors.join(', '));
  if (elements.length === 0) return;

  const activeTimers = new Map();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      
      if (entry.isIntersecting) {
        if (activeTimers.has(el)) {
          clearInterval(activeTimers.get(el));
          activeTimers.delete(el);
        }
        startTypingCharByChar(el, activeTimers);
      } else {
        if (activeTimers.has(el)) {
          clearInterval(activeTimers.get(el));
          activeTimers.delete(el);
        }
        if (el.dataset.originalText) {
          el.innerHTML = el.dataset.originalText;
        }
        el.classList.remove('typewriter-active');
      }
    });
  }, { threshold: 0.15 });

  elements.forEach(el => {
    if (!el.dataset.originalText) {
      el.dataset.originalText = el.textContent.trim();
    }
    if (!el.style.minHeight) {
      el.style.minHeight = `${Math.max(36, el.offsetHeight)}px`;
    }
    observer.observe(el);
  });
}

function startTypingCharByChar(el, activeTimers) {
  const fullText = el.dataset.originalText || '';
  if (!fullText) return;

  el.innerHTML = '';
  el.classList.add('typewriter-active');
  const originalWhiteSpace = el.style.whiteSpace;
  el.style.whiteSpace = 'pre-wrap';

  let charIndex = 0;
  const speed = parseInt(el.dataset.typeSpeed) || 65; // 65ms per character for smooth, readable typing

  const timer = setInterval(() => {
    if (charIndex < fullText.length) {
      const currentSubstr = fullText.substring(0, charIndex + 1);
      el.innerHTML = `${escapeHTML(currentSubstr)}<span class="typewriter-cursor">▋</span>`;
      charIndex++;
    } else {
      clearInterval(timer);
      activeTimers.delete(el);
      el.innerHTML = fullText;
      el.style.whiteSpace = originalWhiteSpace;
      el.classList.remove('typewriter-active');
    }
  }, speed);

  activeTimers.set(el, timer);
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
