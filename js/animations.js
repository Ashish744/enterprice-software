/* ==========================================================================
   FULCRUM — animations.js
   All GSAP / ScrollTrigger driven motion. Every function checks for the
   presence of its target elements first, so this single file can be safely
   included on every page regardless of which sections exist there.
   ========================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof window.gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out' });

  if (prefersReducedMotion) {
    // Respect the OS setting: kill implicit scroll smoothing / large motion,
    // but we still run the (near-instant) reveals below so content isn't stuck at opacity:0.
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  /* --------------------------- Text split utility ---------------------------- */
  // mode: 'chars' | 'words' | 'lines'
  function splitText(el, mode) {
    if (el.dataset.splitDone) return;
    const original = el.textContent.trim();
    el.setAttribute('aria-label', original);
    el.dataset.splitDone = 'true';

    if (mode === 'chars') {
      el.innerHTML = original.split('').map(function (ch) {
        return ch === ' ' ? ' ' : '<span class="char" aria-hidden="true" style="display:inline-block;">' + ch + '</span>';
      }).join('');
    } else if (mode === 'words') {
      el.innerHTML = original.split(' ').map(function (w) {
        return '<span class="word" aria-hidden="true" style="display:inline-block;overflow:hidden;vertical-align:top;"><span class="word-inner" style="display:inline-block;">' + w + '</span></span>';
      }).join(' ');
    } else if (mode === 'lines') {
      // First pass: wrap words to measure line breaks
      el.innerHTML = original.split(' ').map(function (w) {
        return '<span class="line-word">' + w + '</span>';
      }).join(' ');
      const words = Array.prototype.slice.call(el.querySelectorAll('.line-word'));
      const lines = [];
      let currentTop = null, currentLine = [];
      words.forEach(function (w) {
        const top = w.offsetTop;
        if (currentTop === null) currentTop = top;
        if (Math.abs(top - currentTop) > 2) {
          lines.push(currentLine);
          currentLine = [];
          currentTop = top;
        }
        currentLine.push(w.textContent);
      });
      if (currentLine.length) lines.push(currentLine);
      el.innerHTML = lines.map(function (line) {
        return '<span class="split-line" aria-hidden="true"><span class="split-line-inner" style="display:inline-block;">' + line.join(' ') + '</span></span>';
      }).join(' ');
    }
  }

  /* ------------------------------ Text reveals -------------------------------- */
  function initTextReveals() {
    document.querySelectorAll('[data-split]').forEach(function (el) {
      const mode = el.getAttribute('data-split');
      splitText(el, mode);

      let targets, fromVars;
      if (mode === 'chars') {
        targets = el.querySelectorAll('.char');
        fromVars = { yPercent: 120, opacity: 0, rotateZ: 6 };
      } else if (mode === 'words') {
        targets = el.querySelectorAll('.word-inner');
        fromVars = { yPercent: 110, opacity: 0 };
      } else {
        targets = el.querySelectorAll('.split-line-inner');
        fromVars = { yPercent: 100 };
      }

      gsap.from(targets, Object.assign({}, fromVars, {
        duration: mode === 'chars' ? 0.6 : 0.9,
        stagger: mode === 'chars' ? 0.018 : 0.07,
        ease: mode === 'lines' ? 'power4.out' : 'back.out(1.5)',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true
        }
      }));
    });
  }

  /* Blur-to-sharp reveal */
  function initBlurReveals() {
    document.querySelectorAll('[data-reveal="blur"]').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, filter: 'blur(14px)', y: 24 }, {
        opacity: 1, filter: 'blur(0px)', y: 0,
        duration: 1, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });
  }

  /* Scale typography reveal */
  function initScaleReveals() {
    document.querySelectorAll('[data-reveal="scale-type"]').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, scale: 0.82 }, {
        opacity: 1, scale: 1, duration: 1, ease: 'power3.out', transformOrigin: 'center',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });
  }

  /* Letter-spacing "tracking" reveal — wide tracking collapses to normal */
  function initTrackingReveals() {
    document.querySelectorAll('[data-reveal="tracking"]').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, letterSpacing: '.35em' }, {
        opacity: 1, letterSpacing: '0em', duration: 1.1, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });
  }

  /* Generic fade-up / fade / scale reveals with optional stagger group */
  function initGenericReveals() {
    const groups = {};
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      const type = el.getAttribute('data-reveal');
      if (['blur', 'scale-type', 'tracking'].includes(type)) return; // handled above
      const groupKey = el.getAttribute('data-reveal-group');
      if (groupKey) {
        groups[groupKey] = groups[groupKey] || [];
        groups[groupKey].push(el);
      } else {
        animateReveal(el, type, 0);
      }
    });
    Object.keys(groups).forEach(function (key) {
      const els = groups[key];
      els.forEach(function (el, i) { animateReveal(el, el.getAttribute('data-reveal'), i * 0.09); });
    });
  }

  function animateReveal(el, type, delay) {
    let fromVars = { opacity: 0 };
    if (type === 'fade-up') fromVars.y = 36;
    if (type === 'fade-down') fromVars.y = -36;
    if (type === 'fade-left') fromVars.x = 40;
    if (type === 'fade-right') fromVars.x = -40;
    if (type === 'scale') { fromVars.scale = 0.9; }

    gsap.from(el, Object.assign({}, fromVars, {
      duration: 0.85,
      delay: delay,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    }));
  }

  /* ---------------------------------- Counters -------------------------------- */
  function initCounters() {
    document.querySelectorAll('[data-counter]').forEach(function (el) {
      const end = parseFloat(el.getAttribute('data-counter'));
      const decimals = (el.getAttribute('data-counter').split('.')[1] || '').length;
      const suffix = el.getAttribute('data-counter-suffix') || '';
      const prefix = el.getAttribute('data-counter-prefix') || '';
      const obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: end,
            duration: 1.8,
            ease: 'power2.out',
            onUpdate: function () {
              el.textContent = prefix + obj.v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
            }
          });
        }
      });
    });
  }

  /* --------------------------------- Scramble text ------------------------------ */
  function initScramble() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    document.querySelectorAll('[data-scramble]').forEach(function (el) {
      const final = el.textContent;
      ScrollTrigger.create({
        trigger: el,
        start: 'top 92%',
        once: true,
        onEnter: function () {
          if (prefersReducedMotion) return;
          let iteration = 0;
          const totalIterations = final.length * 3;
          const interval = setInterval(function () {
            el.textContent = final.split('').map(function (ch, idx) {
              if (ch === ' ') return ' ';
              if (idx < iteration / 3) return final[idx];
              return chars[Math.floor(Math.random() * chars.length)];
            }).join('');
            iteration++;
            if (iteration > totalIterations) {
              clearInterval(interval);
              el.textContent = final;
            }
          }, 28);
        }
      });
    });
  }

  /* ------------------------------------ Parallax --------------------------------- */
  function initParallax() {
    if (prefersReducedMotion) return;
    document.querySelectorAll('[data-parallax]').forEach(function (el) {
      const amount = parseFloat(el.getAttribute('data-parallax')) || 60;
      gsap.to(el, {
        y: amount,
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('section') || el.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });
  }

  /* --------------------------------- Hero entrance -------------------------------- */
  function initHeroTimeline() {
    const hero = document.querySelector('[data-hero]');
    if (!hero) return;

    function play() {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('[data-hero-eyebrow]', { opacity: 0, y: 16, duration: 0.6 })
        .from('[data-hero] .split-line-inner', { yPercent: 100, stagger: 0.08, duration: 0.9, ease: 'power4.out' }, '-=0.3')
        .from('[data-hero-desc]', { opacity: 0, y: 16, duration: 0.6 }, '-=0.4')
        .from('[data-hero-actions] > *', { opacity: 0, y: 16, stagger: 0.08, duration: 0.55 }, '-=0.35')
        .from('[data-hero-meta] > *', { opacity: 0, y: 12, stagger: 0.07, duration: 0.5 }, '-=0.3')
        .from('[data-hero-stage]', { opacity: 0, scale: 0.94, duration: 0.9, ease: 'power3.out' }, '-=0.9')
        .from('[data-hero-float]', { opacity: 0, y: 24, stagger: 0.12, duration: 0.7, ease: 'back.out(1.6)' }, '-=0.5');
    }

    // Prevent double-splitting from initTextReveals by marking now
    const titleEl = hero.querySelector('[data-split]');
    if (titleEl) splitText(titleEl, titleEl.getAttribute('data-split'));

    document.addEventListener('fulcrum:loaded', play, { once: true });
    // If loader already fired before this script attached listener (rare), fallback:
    window.setTimeout(function () {
      if (!hero.dataset.played) { hero.dataset.played = 'true'; }
    }, 50);
  }

  /* Floating hero panels: subtle continuous drift */
  function initHeroFloat() {
    if (prefersReducedMotion) return;
    document.querySelectorAll('[data-float]').forEach(function (el, i) {
      gsap.to(el, {
        y: '+=14',
        duration: 2.6 + (i % 3) * 0.4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });
    });
  }

  /* ------------------------------- Horizontal scroll ------------------------------- */
  function initHorizontalScroll() {
    document.querySelectorAll('[data-hscroll]').forEach(function (section) {
      const track = section.querySelector('[data-hscroll-track]');
      if (!track) return;

      function build() {
        const distance = track.scrollWidth - window.innerWidth + 96;
        if (distance <= 0) return null;
        return gsap.to(track, {
          x: -distance,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=' + (distance + window.innerHeight * 0.6),
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        });
      }
      build();
    });
  }

  /* ------------------------------------ Timeline ------------------------------------ */
  function initTimelineSection() {
    const track = document.querySelector('[data-timeline-track]');
    if (!track) return;
    const fill = track.querySelector('.timeline__line-fill');
    const items = track.querySelectorAll('.timeline__item');

    if (fill) {
      gsap.to(fill, {
        height: '100%',
        ease: 'none',
        scrollTrigger: { trigger: track, start: 'top 60%', end: 'bottom 70%', scrub: 0.5 }
      });
    }

    items.forEach(function (item) {
      ScrollTrigger.create({
        trigger: item,
        start: 'top 65%',
        end: 'bottom 65%',
        onToggle: function (self) { item.classList.toggle('is-active', self.isActive); }
      });
      gsap.from(item, {
        opacity: 0, x: -28, duration: 0.7,
        scrollTrigger: { trigger: item, start: 'top 85%', once: true }
      });
    });
  }

  /* ------------------------------- Sticky solutions accordion ------------------------ */
  function initSolutionsAccordion() {
    const items = document.querySelectorAll('[data-solution-item]');
    if (!items.length) return;
    const panels = document.querySelectorAll('[data-solution-panel]');

    function activate(index) {
      items.forEach(function (it, i) { it.classList.toggle('is-active', i === index); });
      panels.forEach(function (p, i) { p.classList.toggle('is-active', i === index); });
    }
    activate(0);

    items.forEach(function (item, index) {
      item.addEventListener('click', function () { activate(index); });
      ScrollTrigger.create({
        trigger: item,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: function (self) { if (self.isActive) activate(index); }
      });
    });
  }

  /* ----------------------------------- Bootstrap -------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    initHeroTimeline();
    initHeroFloat();
    initTextReveals();
    initBlurReveals();
    initScaleReveals();
    initTrackingReveals();
    initGenericReveals();
    initCounters();
    initScramble();
    initParallax();
    initHorizontalScroll();
    initTimelineSection();
    initSolutionsAccordion();

    window.setTimeout(function () { ScrollTrigger.refresh(); }, 600);
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
