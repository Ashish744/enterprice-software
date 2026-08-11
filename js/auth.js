/* ==========================================================================
   FULCRUM — auth.js
   Frontend-only auth flow for the Login and Create Account pages. There is
   no backend here — a real integration would POST to your auth API instead
   of the setTimeout()s below.
   ========================================================================== */

(function () {
  'use strict';

  function showButtonLoading(btn, label) {
    btn.dataset.originalLabel = btn.innerHTML;
    btn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span>' + label;
    btn.disabled = true;
  }
  function resetButton(btn) {
    if (btn.dataset.originalLabel) btn.innerHTML = btn.dataset.originalLabel;
    btn.disabled = false;
  }

  /* --------------------------------- Login form ------------------------------- */
  const loginForm = document.querySelector('[data-login-form]');

  // Admin / Public role toggle
  const roleToggle = document.querySelector('[data-role-toggle]');
  if (roleToggle) {
    var roleButtons = roleToggle.querySelectorAll('.role-toggle__btn');
    roleButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        roleButtons.forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-checked', 'true');
      });
    });
  }

  if (loginForm && window.FulcrumValidation) {
    window.FulcrumValidation.initFormValidation(loginForm, function (form) {
      const submitBtn = form.querySelector('[type="submit"]');
      showButtonLoading(submitBtn, 'Signing in…');

      const emailValue = (form.querySelector('#loginEmail') || {}).value || '';
      const activeRoleBtn = roleToggle ? roleToggle.querySelector('.role-toggle__btn.is-active') : null;
      const role = activeRoleBtn ? activeRoleBtn.getAttribute('data-role') : 'public';
      const destination = role === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';

      window.setTimeout(function () {
        resetButton(submitBtn);
        const alertBox = form.querySelector('[data-form-alert]');
        if (alertBox) {
          alertBox.hidden = false;
          alertBox.className = 'form-alert form-alert--success';
          alertBox.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg><span>Signed in. Taking you to your ' + (role === 'admin' ? 'admin' : '') + ' dashboard…</span>';
        }
        window.setTimeout(function () {
          window.location.href = destination + '?email=' + encodeURIComponent(emailValue) + '&role=' + role;
        }, 900);
      }, 900);
    });
  }

  /* ------------------------------- Create account form -------------------------- */
  const createForm = document.querySelector('[data-create-form]');
  if (createForm && window.FulcrumValidation) {
    window.FulcrumValidation.initFormValidation(createForm, function (form) {
      const submitBtn = form.querySelector('[type="submit"]');
      showButtonLoading(submitBtn, 'Creating account…');
      const emailValue = (form.querySelector('#caEmail') || {}).value || '';
      const firstName = (form.querySelector('#caFirstName') || {}).value || '';
      const lastName = (form.querySelector('#caLastName') || {}).value || '';
      const fullName = (firstName + ' ' + lastName).trim();
      window.setTimeout(function () {
        resetButton(submitBtn);
        const wrap = document.querySelector('[data-create-wrap]');
        const success = document.querySelector('[data-create-success]');
        const goToDash = document.querySelector('[data-create-success] [data-go-dashboard]');
        if (goToDash) {
          var params = 'email=' + encodeURIComponent(emailValue) + '&role=public';
          if (fullName) params += '&name=' + encodeURIComponent(fullName);
          goToDash.setAttribute('href', 'login.html?' + params);
        }
        if (wrap && success) {
          gsapSafeFade(wrap, success);
        }
      }, 1000);
    });
  }

  function gsapSafeFade(hideEl, showEl) {
    if (window.gsap) {
      gsap.to(hideEl, {
        opacity: 0, y: -10, duration: 0.35, onComplete: function () {
          hideEl.hidden = true;
          showEl.hidden = false;
          gsap.fromTo(showEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 });
        }
      });
    } else {
      hideEl.hidden = true;
      showEl.hidden = false;
    }
  }
})();
