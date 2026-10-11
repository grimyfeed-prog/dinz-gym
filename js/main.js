/* ================================================================
   DINZ GYM – Main JavaScript
   ================================================================ */

'use strict';

/* ── Utility helpers ─────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Current Year ────────────────────────────────────────────────── */
const yearEl = $('#currentYear');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ================================================================
   NAVBAR
   ================================================================ */
const navbar    = $('#navbar');
const hamburger = $('#hamburger');
const navLinks  = $('#navLinks');
const overlay   = $('#mobileOverlay');
const allNavLinks = $$('.nav-link');

/** Toggle transparent → solid navbar on scroll */
function handleNavScroll() {
  const scrolled = window.scrollY > 40;
  navbar.classList.toggle('scrolled', scrolled);
}

/** Highlight active nav link based on current scroll position */
function updateActiveNavLink() {
  const sections = $$('section[id]');
  const scrollY  = window.scrollY + parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) + 20;

  let currentId = '';
  sections.forEach(section => {
    if (section.offsetTop <= scrollY) {
      currentId = section.id;
    }
  });

  allNavLinks.forEach(link => {
    const href = link.getAttribute('href')?.replace('#', '');
    link.classList.toggle('active', href === currentId);
  });
}

/** Open / close mobile menu */
function openMobileMenu() {
  navLinks.classList.add('open');
  hamburger.classList.add('open');
  overlay.classList.add('active');
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  navLinks.classList.remove('open');
  hamburger.classList.remove('open');
  overlay.classList.remove('active');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

hamburger?.addEventListener('click', () => {
  const isOpen = navLinks.classList.contains('open');
  isOpen ? closeMobileMenu() : openMobileMenu();
});

overlay?.addEventListener('click', closeMobileMenu);

/** Close menu when a nav link is clicked */
allNavLinks.forEach(link => {
  link.addEventListener('click', () => {
    if (navLinks.classList.contains('open')) closeMobileMenu();
  });
});

/** Close menu on Escape */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navLinks.classList.contains('open')) closeMobileMenu();
});

window.addEventListener('scroll', () => {
  handleNavScroll();
  updateActiveNavLink();
}, { passive: true });

handleNavScroll();
updateActiveNavLink();

/* ================================================================
   HERO PARALLAX
   ================================================================ */
const heroImg = $('#heroImg');

if (heroImg && !prefersReducedMotion()) {
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY   = window.scrollY;
        const heroH     = $('#home')?.offsetHeight ?? window.innerHeight;
        if (scrollY < heroH) {
          const shift = scrollY * 0.35;
          heroImg.style.transform = `translateY(${shift}px) scale(1.05)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ================================================================
   SCROLL-REVEAL (Intersection Observer)
   ================================================================ */
const revealEls = $$('.animate-reveal');

if ('IntersectionObserver' in window && !prefersReducedMotion()) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach(el => revealObserver.observe(el));
} else {
  /* Fallback: show everything immediately */
  revealEls.forEach(el => el.classList.add('in-view'));
}

/* ================================================================
   STATISTICS COUNTER ANIMATION
   ================================================================ */
const statNumbers = $$('.stat-number');

function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix ?? '';
  const duration = prefersReducedMotion() ? 0 : 1800;
  const startTime = performance.now();
  const startVal = 0;

  if (duration === 0) {
    el.textContent = target + suffix;
    return;
  }

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function tick(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value    = Math.round(startVal + (target - startVal) * easeOutCubic(progress));
    el.textContent = value + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

if ('IntersectionObserver' in window) {
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          statsObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  statNumbers.forEach(el => statsObserver.observe(el));
} else {
  statNumbers.forEach(el => animateCounter(el));
}

/* ================================================================
   GALLERY FILTER
   ================================================================ */
const filterBtns  = $$('.filter-btn');
const galleryItems = $$('.gallery-item');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;

    /* Update active state */
    filterBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    /* Show / hide items */
    galleryItems.forEach(item => {
      const category = item.dataset.category;
      const show = filter === 'all' || category === filter;
      item.classList.toggle('hidden', !show);
    });
  });
});

/* ================================================================
   CONTACT FORM VALIDATION
   ================================================================ */
const contactForm   = $('#contactForm');
const formSuccess   = $('#formSuccess');

/** Indian mobile number: starts with 6–9, 10 digits */
function isValidIndianPhone(val) {
  const clean = val.replace(/[\s\-\(\)\+]/g, '');
  return /^[6-9]\d{9}$/.test(clean);
}

function isValidEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val.trim());
}

function setFieldError(input, errorEl, msg) {
  input.classList.add('error');
  errorEl.textContent = msg;
}

function clearFieldError(input, errorEl) {
  input.classList.remove('error');
  errorEl.textContent = '';
}

function validateField(input) {
  const id  = input.id;
  const val = input.value.trim();
  const errorEl = $('#' + id + 'Error');
  if (!errorEl) return true;

  clearFieldError(input, errorEl);

  if (input.required && !val) {
    setFieldError(input, errorEl, 'This field is required.');
    return false;
  }

  if (id === 'email' && val && !isValidEmail(val)) {
    setFieldError(input, errorEl, 'Please enter a valid email address.');
    return false;
  }

  if (id === 'phone' && val && !isValidIndianPhone(val)) {
    setFieldError(input, errorEl, 'Please enter a valid 10-digit Indian mobile number (starting with 6–9).');
    return false;
  }

  return true;
}

/** Live validation on blur */
$$('.form-input', contactForm ?? document).forEach(input => {
  if (input.tagName === 'SELECT') return;
  input.addEventListener('blur', () => validateField(input));
  input.addEventListener('input', () => {
    if (input.classList.contains('error')) validateField(input);
  });
});

contactForm?.addEventListener('submit', e => {
  e.preventDefault();

  const fields = $$('.form-input[required]', contactForm);
  let allValid = true;

  fields.forEach(field => {
    if (!validateField(field)) allValid = false;
  });

  if (!allValid) {
    const firstError = $('.form-input.error', contactForm);
    firstError?.focus();
    return;
  }

  /* ── EmailJS Submission ────────────────────────────────────────── */
  const submitBtn = $('#submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'SENDING…';

  const templateParams = {
    from_name    : $('#fullName')?.value.trim(),
    from_email   : $('#email')?.value.trim(),
    phone        : $('#phone')?.value.trim(),
    membership   : $('#membership')?.value || 'Not specified',
    message      : $('#message')?.value.trim(),
    to_email     : 'dinzfreaky@gmail.com',
  };

  emailjs
    .send(
      'service_ize4oyk',        // ✅ Your Service ID
      'template_acjlt2k',       // ✅ Template ID
      templateParams
    )
    .then(() => {
      contactForm.hidden = true;
      formSuccess.hidden = false;
    })
    .catch(err => {
      console.error('EmailJS error:', err);
      submitBtn.disabled = false;
      submitBtn.textContent = 'SEND ENQUIRY';
      alert('Something went wrong. Please try again or WhatsApp us at +91 88255 48192.');
    });
});

/** Reset form back to initial state */
window.resetForm = function () {
  contactForm.reset();
  $$('.form-input', contactForm).forEach(i => clearFieldError(i, $('#' + i.id + 'Error') ?? { textContent: '' }));
  contactForm.hidden = false;
  formSuccess.hidden = true;
  const submitBtn = $('#submitBtn');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'SEND ENQUIRY';
  }
};

/* ================================================================
   BACK TO TOP BUTTON
   ================================================================ */
const backToTopBtn = $('#backToTop');

function handleBackToTop() {
  const show = window.scrollY > 600;
  backToTopBtn?.classList.toggle('visible', show);
  if (backToTopBtn) backToTopBtn.hidden = false; /* ensure visible after first scroll */
}

backToTopBtn?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
});

window.addEventListener('scroll', handleBackToTop, { passive: true });

/* ================================================================
   SMOOTH SCROLL for anchor links (fallback for old browsers)
   ================================================================ */
$$('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const target = $(targetId);
    if (!target) return;

    e.preventDefault();
    const navH  = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));
    const top   = target.getBoundingClientRect().top + window.scrollY - navH;
    window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
});

/* ================================================================
   IMAGE FALLBACKS
   ================================================================ */
$$('img[src]').forEach(img => {
  img.addEventListener('error', function () {
    /* Replace broken images with a neutral dark placeholder */
    this.style.backgroundColor = '#1a1a1a';
    this.style.minHeight = '200px';
    this.removeAttribute('src');
    this.alt = 'Image unavailable';
  }, { once: true });
});

/* ================================================================
   MEMBERSHIP PLAN SELECTION (pre-fills contact form)
   ================================================================ */
$$('.pricing-card .btn').forEach(btn => {
  btn.addEventListener('click', function (e) {
    const card      = this.closest('.pricing-card');
    const tierEl    = card?.querySelector('.pricing-tier');
    const priceEl   = card?.querySelector('.pricing-price');
    const currEl    = card?.querySelector('.pricing-currency');
    const periodEl  = card?.querySelector('.pricing-period');
    const select    = $('#membership');

    if (tierEl && select) {
      const tier = tierEl.textContent.trim().toLowerCase();
      /* Match option value */
      const option = [...select.options].find(o => o.value === tier);
      if (option) select.value = tier;
    }
  });
});

/* ================================================================
   INITIAL SETUP COMPLETE
   ================================================================ */
console.log('%cDINZ GYM%c – Site loaded successfully ✓', 
  'color:#f97316;font-weight:bold;font-size:14px;',
  'color:#888;font-size:12px;'
);
