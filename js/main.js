/* ==========================================================================
   FULCRUM — main.js
   Site-wide chrome & micro-interactions shared by every page.
   ========================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';

  /* --------------------------------- Loader -------------------------------- */
  function initLoader() {
    const loader = document.querySelector('[data-loader]');
    if (!loader) return;

    const cells = loader.querySelectorAll('.loader__cell');
    const pct = loader.querySelector('[data-loader-pct]');

    document.body.classList.add('no-scroll');

    if (prefersReducedMotion || !hasGSAP) {
      // Simple fallback: quick fade, no fuss.
      window.setTimeout(function () {
        loader.classList.add('is-hidden');
        loader.style.opacity = '0';
        document.body.classList.remove('no-scroll');
        window.setTimeout(function () { loader.remove(); }, 400);
      }, 400);
      return;
    }

    const tl = gsap.timeline({
      onComplete: function () {
        document.body.classList.remove('no-scroll');
        loader.remove();
        // Kick off hero / page entrance once the loader is gone.
        document.dispatchEvent(new CustomEvent('fulcrum:loaded'));
      }
    });

    tl.to(cells, {
      opacity: 1,
      scale: 1,
      duration: 0.5,
      stagger: { each: 0.045, from: 'center', grid: [3, 4] },
      ease: 'back.out(2)'
    });

    let counter = { v: 0 };
    tl.to(counter, {
      v: 100,
      duration: 1.1,
      ease: 'power1.inOut',
      onUpdate: function () { if (pct) pct.textContent = Math.round(counter.v) + '%'; }
    }, 0.15);

    tl.to(cells, {
      opacity: 0,
      scale: 0.5,
      duration: 0.35,
      stagger: { each: 0.02, from: 'center', grid: [3, 4] },
      ease: 'power2.in'
    }, '+=0.15');

    tl.to(pct, { opacity: 0, duration: 0.2 }, '<');

    tl.to(loader, {
      yPercent: -100,
      duration: 0.7,
      ease: 'power4.inOut'
    }, '-=0.1');
  }

  /* Fallback so pages without a loader still fire the "loaded" hook */
  function ensureLoadedEvent() {
    if (!document.querySelector('[data-loader]')) {
      document.dispatchEvent(new CustomEvent('fulcrum:loaded'));
    }
  }

  /* --------------------------------- Nav ----------------------------------- */
  function initNav() {
    const nav = document.querySelector('[data-nav]');
    if (nav) {
      const onScroll = function () {
        nav.classList.toggle('is-scrolled', window.scrollY > 16);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Mark active link based on current page
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__links a[href], .mobile-menu__links a[href]').forEach(function (a) {
      const href = a.getAttribute('href');
      if (href === path || (path === '' && href === 'index.html')) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
    });

    // Mobile menu
    const burger = document.querySelector('[data-burger]');
    const mobileMenu = document.querySelector('[data-mobile-menu]');
    if (burger && mobileMenu) {
      burger.addEventListener('click', function () {
        const isOpen = mobileMenu.classList.toggle('is-open');
        burger.classList.toggle('is-open', isOpen);
        burger.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('no-scroll', isOpen);
        if (nav) {
          // Keep the nav bar solid/opaque and visible above the menu, and
          // line the menu's top edge up exactly with the real nav height
          // (which changes slightly between top-of-page and scrolled states).
          nav.classList.toggle('menu-open', isOpen);
          mobileMenu.style.top = nav.getBoundingClientRect().height + 'px';
        }
      });
      window.addEventListener('resize', function () {
        if (nav && mobileMenu.classList.contains('is-open')) {
          mobileMenu.style.top = nav.getBoundingClientRect().height + 'px';
        }
      });
      mobileMenu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          mobileMenu.classList.remove('is-open');
          burger.classList.remove('is-open');
          document.body.classList.remove('no-scroll');
          if (nav) nav.classList.remove('menu-open');
        });
      });
      // Escape closes menu
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
          mobileMenu.classList.remove('is-open');
          burger.classList.remove('is-open');
          document.body.classList.remove('no-scroll');
          if (nav) nav.classList.remove('menu-open');
        }
      });
    }
  }

  /* ---------------------------- Balance-beam scroll progress ---------------- */
  function initBalanceBeam() {
    const beam = document.querySelector('[data-balance-beam]');
    if (!beam) return;
    const fill = beam.querySelector('.balance-beam__fill');
    const pivot = beam.querySelector('.balance-beam__pivot');

    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      fill.style.width = pct + '%';
      pivot.style.left = pct + '%';
      // Subtle tilt: the beam "balances" as you scroll, like a lever
      const tilt = (pct - 50) / 50 * 1.2; // -1.2deg .. 1.2deg
      beam.style.transform = 'rotate(' + tilt + 'deg)';
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* -------------------------------- Cursor ----------------------------------*/
  function initCursor() {
    const dot = document.querySelector('[data-cursor-dot]');
    const ring = document.querySelector('[data-cursor-ring]');
    if (!dot || !ring || prefersReducedMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
    });
    (function raf() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(raf);
    })();

    document.querySelectorAll('a, button, [data-cursor-hover]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('is-active'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('is-active'); });
    });
  }

  /* ------------------------------ Magnetic buttons ---------------------------*/
  function initMagnetic() {
    if (prefersReducedMotion) return;
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      const strength = parseFloat(el.getAttribute('data-magnetic')) || 0.35;
      el.addEventListener('mousemove', function (e) {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * strength;
        const y = (e.clientY - rect.top - rect.height / 2) * strength;
        el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = 'translate(0,0)';
      });
    });
  }

  /* ------------------------------ Spotlight cards -----------------------------*/
  function initSpotlight() {
    document.querySelectorAll('.card-spotlight').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      });
    });
  }

  /* ---------------------------------- Marquee ---------------------------------*/
  function initMarquee() {
    document.querySelectorAll('[data-marquee]').forEach(function (marquee) {
      const track = marquee.querySelector('.marquee__track');
      if (!track) return;
      // Duplicate content once for a seamless loop
      track.innerHTML += track.innerHTML;
      const speed = parseFloat(marquee.getAttribute('data-speed')) || 40; // px/sec

      if (prefersReducedMotion) return;

      if (hasGSAP) {
        let totalWidth = track.scrollWidth / 2;
        const tween = gsap.to(track, {
          x: -totalWidth,
          duration: totalWidth / speed,
          ease: 'none',
          repeat: -1
        });
        marquee.addEventListener('mouseenter', function () { tween.timeScale(0.25); });
        marquee.addEventListener('mouseleave', function () { tween.timeScale(1); });
      }
    });
  }

  /* Footer word marquee (opposite direction, purely decorative) */
  function initFooterMarquee() {
    const el = document.querySelector('[data-footer-marquee]');
    if (!el || prefersReducedMotion || !hasGSAP) return;
    const track = el.querySelector('.footer__marquee-track');
    track.innerHTML += track.innerHTML;
    const width = track.scrollWidth / 2;
    gsap.fromTo(track, { x: -width }, { x: 0, duration: width / 55, ease: 'none', repeat: -1 });
  }

  /* ------------------------------- Expandable cards ----------------------------*/
  function initExpandCards() {
    document.querySelectorAll('.expand-card').forEach(function (card) {
      const head = card.querySelector('.expand-card__head');
      const body = card.querySelector('.expand-card__body');
      if (!head || !body) return;
      head.setAttribute('aria-expanded', 'false');
      head.addEventListener('click', function () {
        const isOpen = card.classList.toggle('is-open');
        head.setAttribute('aria-expanded', String(isOpen));
        body.style.maxHeight = isOpen ? body.scrollHeight + 'px' : '0px';
      });
      head.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); head.click(); }
      });
    });
    // Keep open cards correctly sized on resize
    window.addEventListener('resize', function () {
      document.querySelectorAll('.expand-card.is-open .expand-card__body').forEach(function (body) {
        body.style.maxHeight = body.scrollHeight + 'px';
      });
    });
  }

  /* ---------------------------------- Flip cards ---------------------------------*/
  function initFlipCards() {
    // Hover already handled in CSS; this adds keyboard + tap support for touch/a11y.
    document.querySelectorAll('.flip-card').forEach(function (card) {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.classList.toggle('is-flipped'); }
      });
      card.addEventListener('click', function () {
        if (window.matchMedia('(hover: none)').matches) card.classList.toggle('is-flipped');
      });
    });
  }

  /* ----------------------------- Password show/hide -------------------------------*/
  function initPasswordToggles() {
    document.querySelectorAll('[data-password-toggle]').forEach(function (btn) {
      const targetSel = btn.getAttribute('data-password-toggle');
      const input = document.querySelector(targetSel);
      if (!input) return;
      btn.addEventListener('click', function () {
        const isVisible = input.type === 'text';
        input.type = isVisible ? 'password' : 'text';
        btn.classList.toggle('is-visible', !isVisible);
        btn.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
      });
    });
  }

  /* -------------------------- Auto-rotating hero background photos -------------- */
  function initHeroBgRotator() {
    document.querySelectorAll('[data-hero-bg-rotator]').forEach(function (container) {
      const slides = container.querySelectorAll('.hero-bg-slide');
      if (slides.length < 2 || prefersReducedMotion) return;
      let idx = 0;
      setInterval(function () {
        slides[idx].classList.remove('is-active');
        idx = (idx + 1) % slides.length;
        slides[idx].classList.add('is-active');
      }, 5000);
    });
  }

  /* If a photo fails to load (offline, blocked, swapped-out placeholder URL),
     hide it rather than showing a broken-image icon — every image on this site
     sits on top of a solid/gradient fallback background, so hiding it degrades
     gracefully. */
  function initImageFallbacks() {
    document.addEventListener('error', function (e) {
      if (e.target && e.target.tagName === 'IMG') {
        e.target.style.display = 'none';
      }
    }, true);
  }

  /* --------------------------------- Bootstrap ------------------------------------*/
  document.addEventListener('DOMContentLoaded', function () {
    initLoader();
    ensureLoadedEvent();
    initNav();
    initBalanceBeam();
    initCursor();
    initMagnetic();
    initSpotlight();
    initMarquee();
    initFooterMarquee();
    initExpandCards();
    initFlipCards();
    initPasswordToggles();
    initHeroBgRotator();
    initImageFallbacks();
  });
})();
