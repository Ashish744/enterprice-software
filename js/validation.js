/* ==========================================================================
   FULCRUM — validation.js
   Reusable validation used everywhere a name / email / password / phone
   field appears (Contact, Login, Create Account, and any future form).
   Nothing page-specific lives here — pages only add `data-validate="..."`
   attributes to their inputs.
   ========================================================================== */

(function (window) {
  'use strict';

  /* ------------------------------ Validators ------------------------------ */
  // Every validator receives the raw string value and returns true/false.
  const Validators = {
    // Letters, spaces, hyphens and apostrophes only (e.g. "Mary-Jane", "O'Neil")
    name: function (value) {
      const v = value.trim();
      if (v.length < 1 || v.length > 60) return false;
      return /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(v);
    },
    email: function (value) {
      const v = value.trim();
      // Practical RFC-5322-ish pattern: local@domain.tld
      return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(v);
    },
    password: function (value) {
      return value.length >= 8;
    },
    required: function (value) {
      return value.trim().length > 0;
    },
    phone: function (value) {
      const v = value.trim();
      if (v === '') return true; // phone is optional unless marked required too
      return /^[0-9+\-\s().]{7,20}$/.test(v);
    },
    checkbox: function (value, el) {
      return el.checked === true;
    }
  };

  const DEFAULT_MESSAGES = {
    name: 'Please use letters only (no numbers or symbols).',
    email: 'Please enter a valid email address.',
    password: 'Password must be at least 8 characters.',
    required: 'This field is required.',
    phone: 'Please enter a valid phone number.',
    checkbox: 'Please check this box to continue.',
    match: "Passwords don't match."
  };

  function passwordStrength(value) {
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
    return Math.min(score, 3);
  }

  /* ------------------------------ Field wiring ----------------------------- */
  function getFieldWrap(input) {
    return input.closest('[data-field], .field') || input.parentElement;
  }

  function getMsgEl(wrap) {
    return wrap.querySelector('[data-field-msg], .field-msg');
  }

  function setInvalid(input, message) {
    const wrap = getFieldWrap(input);
    wrap.classList.add('is-invalid');
    wrap.classList.remove('is-valid');
    input.setAttribute('aria-invalid', 'true');
    const msgEl = getMsgEl(wrap);
    if (msgEl) msgEl.textContent = message;
  }

  function setValid(input) {
    const wrap = getFieldWrap(input);
    wrap.classList.remove('is-invalid');
    wrap.classList.add('is-valid');
    input.setAttribute('aria-invalid', 'false');
  }

  function clearState(input) {
    const wrap = getFieldWrap(input);
    wrap.classList.remove('is-invalid', 'is-valid');
    input.removeAttribute('aria-invalid');
  }

  // Validate a single input, returns true/false. Handles password-confirm matching.
  function validateInput(input, opts) {
    opts = opts || {};
    const type = input.getAttribute('data-validate');
    if (!type) return true;

    const isRequired = input.hasAttribute('required') || input.getAttribute('data-required') === 'true';
    const value = input.type === 'checkbox' ? '' : input.value;

    // Empty + not required = neutral/valid (unless user already touched it and it's genuinely required elsewhere)
    if (!isRequired && type !== 'checkbox' && value.trim() === '') {
      clearState(input);
      return true;
    }

    let valid = true;
    let message = input.getAttribute('data-error-message') || DEFAULT_MESSAGES[type] || 'Please check this field.';

    if (type === 'password-confirm') {
      const matchSelector = input.getAttribute('data-match');
      const other = matchSelector ? document.querySelector(matchSelector) : null;
      valid = isRequired ? Validators.required(value) : true;
      if (valid && other) valid = value === other.value;
      message = DEFAULT_MESSAGES.match;
    } else if (type === 'checkbox') {
      valid = Validators.checkbox(value, input);
    } else if (typeof Validators[type] === 'function') {
      valid = Validators[type](value);
      if (valid && isRequired) valid = Validators.required(value);
    }

    if (!valid) {
      setInvalid(input, message);
    } else {
      setValid(input);
    }

    // Optional live password-strength meter
    if (type === 'password') {
      const wrap = getFieldWrap(input);
      const meter = wrap.querySelector('[data-password-strength]');
      if (meter) {
        const level = value.length ? passwordStrength(value) : 0;
        meter.setAttribute('data-level', String(level));
      }
      // Re-validate confirm field live if it already has a value
      const confirmSel = input.getAttribute('data-confirm-target');
      if (confirmSel) {
        const confirmEl = document.querySelector(confirmSel);
        if (confirmEl && confirmEl.value) validateInput(confirmEl);
      }
    }

    return valid && (opts.silentEmptyOk ? true : true);
  }

  function attachLiveValidation(input) {
    let touched = false;
    input.addEventListener('blur', function () {
      touched = true;
      validateInput(input);
    });
    input.addEventListener('input', function () {
      if (touched) validateInput(input); // re-validate as they fix it
      if (input.getAttribute('data-validate') === 'password') validateInput(input);
    });
    if (input.type === 'checkbox') {
      input.addEventListener('change', function () { validateInput(input); });
    }
  }

  function validateForm(form) {
    const inputs = form.querySelectorAll('[data-validate]');
    let allValid = true;
    inputs.forEach(function (input) {
      const ok = validateInput(input, { silentEmptyOk: false });
      // Force-check required-but-empty fields on submit
      const isRequired = input.hasAttribute('required') || input.getAttribute('data-required') === 'true';
      const value = input.type === 'checkbox' ? '' : input.value;
      if (isRequired && input.type === 'checkbox' && !input.checked) {
        setInvalid(input, input.getAttribute('data-error-message') || DEFAULT_MESSAGES.checkbox);
        allValid = false;
        return;
      }
      if (isRequired && input.type !== 'checkbox' && value.trim() === '') {
        setInvalid(input, DEFAULT_MESSAGES.required);
        allValid = false;
        return;
      }
      if (!ok) allValid = false;
    });
    return allValid;
  }

  function initFormValidation(form, onValidSubmit) {
    form.querySelectorAll('[data-validate]').forEach(attachLiveValidation);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const alertBox = form.querySelector('[data-form-alert]');
      const valid = validateForm(form);

      if (!valid) {
        if (alertBox) {
          alertBox.hidden = false;
          alertBox.className = 'form-alert form-alert--error';
          alertBox.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg><span>Please fix the highlighted fields before continuing.</span>';
        }
        const firstInvalid = form.querySelector('.is-invalid input, .is-invalid textarea, .field.is-invalid');
        if (firstInvalid) {
          const el = firstInvalid.matches('input,textarea') ? firstInvalid : firstInvalid.querySelector('input,textarea');
          if (el) el.focus();
        }
        return;
      }

      if (alertBox) alertBox.hidden = true;
      if (typeof onValidSubmit === 'function') onValidSubmit(form);
    });
  }

  // Expose a tiny public API
  window.FulcrumValidation = {
    Validators: Validators,
    validateInput: validateInput,
    validateForm: validateForm,
    initFormValidation: initFormValidation,
    passwordStrength: passwordStrength
  };
})(window);
