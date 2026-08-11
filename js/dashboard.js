/* ==========================================================================
   FULCRUM — dashboard.js
   Behavior shared by both the Admin Dashboard and the Public/User Dashboard.
   ========================================================================== */

(function () {
  'use strict';

  function initDropdown(triggerSel, menuHolderSel) {
    const holder = document.querySelector(menuHolderSel);
    if (!holder) return;
    const trigger = holder.querySelector(triggerSel);
    if (!trigger) return;

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      const isOpen = holder.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', String(isOpen));
    });
    document.addEventListener('click', function (e) {
      if (!holder.contains(e.target)) holder.classList.remove('is-open');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') holder.classList.remove('is-open');
    });
  }

  function initSidebarToggle() {
    const btn = document.querySelector('[data-sidebar-toggle]');
    const sidebar = document.querySelector('[data-sidebar]');
    const backdrop = document.querySelector('[data-sidebar-backdrop]');
    if (!btn || !sidebar) return;

    function setOpen(open) {
      sidebar.classList.toggle('is-open', open);
      if (backdrop) backdrop.classList.toggle('is-visible', open);
      btn.setAttribute('aria-expanded', String(open));
    }

    btn.addEventListener('click', function () {
      setOpen(!sidebar.classList.contains('is-open'));
    });
    if (backdrop) backdrop.addEventListener('click', function () { setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    sidebar.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (window.innerWidth <= 960) setOpen(false);
      });
    });
  }

  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(function (group) {
      const tabs = group.querySelectorAll('[data-tab]');
      const panels = document.querySelectorAll('[data-tab-panel]');
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          const target = tab.getAttribute('data-tab');
          tabs.forEach(function (t) { t.classList.remove('is-active'); });
          tab.classList.add('is-active');
          panels.forEach(function (p) {
            p.hidden = p.getAttribute('data-tab-panel') !== target;
          });
        });
      });
    });
  }

  /* Sidebar-driven content panels — lets every sidebar item show its own
     real content instead of being a dead `href="#"` link. All panels live
     in the DOM already; this just shows/hides them, client-side. */
  function initSidebarPanels() {
    const links = document.querySelectorAll('[data-sidebar] [data-panel]');
    const panels = document.querySelectorAll('[data-panel-content]');
    const titleEl = document.querySelector('[data-panel-title]');
    if (!links.length || !panels.length) return;

    function activate(target, pushFocus) {
      links.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('data-panel') === target); });
      panels.forEach(function (p) {
        const match = p.getAttribute('data-panel-content') === target;
        p.hidden = !match;
        if (match && window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          gsap.fromTo(p, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .45, ease: 'power3.out' });
        }
      });
      const activeLink = Array.prototype.find.call(links, function (l) { return l.getAttribute('data-panel') === target; });
      if (titleEl && activeLink) titleEl.textContent = activeLink.getAttribute('data-panel-label') || activeLink.textContent.trim();

      // Close the mobile sidebar drawer after a selection
      if (window.innerWidth <= 960) {
        const sidebar = document.querySelector('[data-sidebar]');
        const backdrop = document.querySelector('[data-sidebar-backdrop]');
        const btn = document.querySelector('[data-sidebar-toggle]');
        if (sidebar) sidebar.classList.remove('is-open');
        if (backdrop) backdrop.classList.remove('is-visible');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        activate(link.getAttribute('data-panel'));
      });
    });
  }

  /* Randomize demo sparkline / bar heights so the dashboard doesn't look static/fake */
  function animateBars() {
    document.querySelectorAll('.chart-bars .bar').forEach(function (bar) {
      const h = bar.getAttribute('data-height') || '40';
      if (window.gsap) {
        gsap.fromTo(bar, { height: '0%' }, {
          height: h + '%', duration: 1, ease: 'power3.out',
          scrollTrigger: window.ScrollTrigger ? { trigger: bar, start: 'top 95%', once: true } : undefined
        });
      } else {
        bar.style.height = h + '%';
      }
    });
    document.querySelectorAll('.kpi-card__spark span').forEach(function (bar) {
      const h = bar.getAttribute('data-height') || '30';
      bar.style.height = h + '%';
    });
  }

  /* Populate the profile chip (avatar + name) from ?email=&name=&role= passed by login/create-account */
  function initProfileFromQuery() {
    var params = new URLSearchParams(window.location.search);
    var email = params.get('email');
    var name = params.get('name');
    if (!email) return;

    var nameEl = document.querySelector('.dash-profile__name');
    var avatarEls = document.querySelectorAll('.dash-profile__avatar');
    var welcomeEl = document.querySelector('[data-welcome-name]');

    var displayName = name && name.trim() ? name.trim() : email;
    var initialsSource = name && name.trim() ? name.trim() : email.split('@')[0].replace(/[._-]+/g, ' ');
    var words = initialsSource.trim().split(/\s+/).filter(Boolean);
    var initials = words.length > 1
      ? (words[0][0] + words[1][0])
      : (initialsSource.slice(0, 2) || '??');
    initials = initials.toUpperCase();

    if (nameEl) nameEl.textContent = displayName;
    avatarEls.forEach(function (el) { el.textContent = initials; });

    // First-name-only greeting in the welcome banner, if present
    if (welcomeEl) {
      var firstName = name && name.trim() ? name.trim().split(/\s+/)[0] : email.split('@')[0].split(/[._-]/)[0];
      firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
      welcomeEl.textContent = firstName;
    }

    // Also show the raw email as a small subtitle under the name in the dropdown, if a slot exists
    var emailSlot = document.querySelector('[data-profile-email]');
    if (emailSlot) emailSlot.textContent = email;

    // Populate the dedicated "My profile" panel, if this page has one
    var panelName = document.querySelector('[data-profile-panel-name]');
    var panelEmail = document.querySelector('[data-profile-panel-email]');
    var panelNameInput = document.querySelector('[data-profile-panel-name-input]');
    var panelEmailInput = document.querySelector('[data-profile-panel-email-input]');
    if (panelName) panelName.textContent = displayName;
    if (panelEmail) panelEmail.textContent = email;
    if (panelNameInput) panelNameInput.value = displayName;
    if (panelEmailInput) panelEmailInput.value = email;
  }

  /* Task list — click the circle to mark a task complete (in-memory only) */
  function initTaskList() {
    document.querySelectorAll('[data-task-list] .task-check').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.closest('.task-row').classList.toggle('is-done');
        updateTaskBadge();
      });
    });
  }
  function updateTaskBadge() {
    var list = document.querySelector('[data-task-list]');
    var badge = document.querySelector('[data-panel="tasks"] .dash-sidebar__badge');
    if (!list || !badge) return;
    var remaining = list.querySelectorAll('.task-row:not(.is-done)').length;
    badge.textContent = String(remaining);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initDropdown('[data-profile-trigger]', '[data-profile-menu]');
    initDropdown('[data-notif-trigger]', '[data-notif-menu]');
    initSidebarToggle();
    initSidebarPanels();
    initTabs();
    animateBars();
    initProfileFromQuery();
    initTaskList();
  });
})();
