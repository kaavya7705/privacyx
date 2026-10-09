/**
 * PrivacyX Shield — Content Script
 * Scans forms for PII before submission, highlights sensitive fields,
 * and offers visual warnings when personal data is being entered.
 * 
 * NEVER reads or stores actual field values — only detects patterns.
 */

(() => {
  "use strict";

  // PII patterns (same as background.js)
  const PII_PATTERNS = {
    email: {
      regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
      severity: "high",
      label: "Email Address",
    },
    phone: {
      regex: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/,
      severity: "high",
      label: "Phone Number",
    },
    creditCard: {
      regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/,
      severity: "critical",
      label: "Credit Card",
    },
    ssn: {
      regex: /\b\d{3}-\d{2}-\d{4}\b/,
      severity: "critical",
      label: "SSN",
    },
  };

  // Sensitive input types and names
  const SENSITIVE_FIELD_NAMES = [
    "password", "passwd", "secret", "token", "api_key", "apikey",
    "ssn", "social_security", "credit_card", "card_number", "cvv", "cvc",
    "account_number", "routing_number", "pin",
  ];

  const SENSITIVE_INPUT_TYPES = ["password"];

  // Track already-warned fields to avoid spam
  const warnedFields = new WeakSet();

  // =========================================================================
  // Inject warning styles
  // =========================================================================
  const style = document.createElement("style");
  style.textContent = `
    .privacyx-warning {
      outline: 2px solid #ff006e !important;
      box-shadow: 0 0 12px rgba(255, 0, 110, 0.4) !important;
      position: relative;
    }
    .privacyx-warning-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #ff006e;
      color: white;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 8px;
      z-index: 999999;
      font-family: 'Inter', system-ui, sans-serif;
      box-shadow: 0 2px 8px rgba(255, 0, 110, 0.5);
      pointer-events: none;
    }
    .privacyx-toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #1a2342 0%, #0f1629 100%);
      border: 1px solid #ff006e;
      border-radius: 12px;
      padding: 16px 20px;
      color: #e2e8f0;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 13px;
      max-width: 360px;
      z-index: 2147483647;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 0, 110, 0.2);
      animation: privacyx-slide-in 0.3s ease-out;
      backdrop-filter: blur(20px);
    }
    .privacyx-toast-title {
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 6px;
      color: #ff006e;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .privacyx-toast-body {
      color: #94a3b8;
      line-height: 1.5;
    }
    .privacyx-toast-close {
      position: absolute;
      top: 8px;
      right: 12px;
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 16px;
      cursor: pointer;
      padding: 4px;
    }
    .privacyx-toast-close:hover {
      color: #e2e8f0;
    }
    @keyframes privacyx-slide-in {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes privacyx-slide-out {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // =========================================================================
  // Toast notification system
  // =========================================================================
  let activeToast = null;

  function showToast(title, message, duration = 5000) {
    if (activeToast) {
      activeToast.remove();
    }

    const toast = document.createElement("div");
    toast.className = "privacyx-toast";
    toast.innerHTML = `
      <button class="privacyx-toast-close">&times;</button>
      <div class="privacyx-toast-title">🛡️ ${title}</div>
      <div class="privacyx-toast-body">${message}</div>
    `;

    toast.querySelector(".privacyx-toast-close").addEventListener("click", () => {
      toast.style.animation = "privacyx-slide-out 0.3s ease-in forwards";
      setTimeout(() => toast.remove(), 300);
    });

    document.body.appendChild(toast);
    activeToast = toast;

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = "privacyx-slide-out 0.3s ease-in forwards";
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }

  // =========================================================================
  // Field scanning
  // =========================================================================
  function isSensitiveField(field) {
    const name = (field.name || "").toLowerCase();
    const id = (field.id || "").toLowerCase();
    const placeholder = (field.placeholder || "").toLowerCase();
    const type = (field.type || "").toLowerCase();
    const autocomplete = (field.autocomplete || "").toLowerCase();

    // Check input type
    if (SENSITIVE_INPUT_TYPES.includes(type)) return true;

    // Check field names
    const allIdentifiers = `${name} ${id} ${placeholder} ${autocomplete}`;
    return SENSITIVE_FIELD_NAMES.some(s => allIdentifiers.includes(s));
  }

  function scanFieldValue(field) {
    const value = field.value || "";
    if (value.length < 4) return null;

    for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
      if (pattern.regex.test(value)) {
        return {
          type,
          label: pattern.label,
          severity: pattern.severity,
        };
      }
    }
    return null;
  }

  function markFieldAsSensitive(field, detail) {
    if (warnedFields.has(field)) return;
    warnedFields.add(field);

    // Add visual warning
    field.classList.add("privacyx-warning");

    // Add badge if field has positioned parent
    const parent = field.parentElement;
    if (parent) {
      const currentPosition = getComputedStyle(parent).position;
      if (currentPosition === "static") {
        parent.style.position = "relative";
      }
      const badge = document.createElement("span");
      badge.className = "privacyx-warning-badge";
      badge.textContent = `🛡️ ${detail.label}`;
      parent.appendChild(badge);
    }
  }

  // =========================================================================
  // Form submission interception
  // =========================================================================
  document.addEventListener("submit", (e) => {
    const form = e.target;
    if (!form || form.tagName !== "FORM") return;

    const inputs = form.querySelectorAll("input, textarea, select");
    const detectedPII = [];

    inputs.forEach((input) => {
      const finding = scanFieldValue(input);
      if (finding) {
        detectedPII.push(finding);
        markFieldAsSensitive(input, finding);
      }
    });

    if (detectedPII.length > 0) {
      const critical = detectedPII.filter(p => p.severity === "critical");

      // Show warning toast
      showToast(
        "PII Detected in Form",
        `This form contains <strong>${detectedPII.map(p => p.label).join(", ")}</strong>. ` +
        `Make sure you trust this website before submitting.`,
        7000
      );

      // Notify background script
      try {
        chrome.runtime.sendMessage({
          action: "piiDetected",
          domain: window.location.hostname,
          severity: critical.length > 0 ? "critical" : "high",
          detail: {
            label: detectedPII.map(p => p.label).join(", "),
            count: detectedPII.length,
            formAction: form.action || window.location.href,
          },
        });
      } catch (e) {
        // Extension context may be invalidated
      }
    }
  }, true);

  // =========================================================================
  // Real-time field monitoring (debounced)
  // =========================================================================
  let scanTimeout = null;

  document.addEventListener("input", (e) => {
    const field = e.target;
    if (!field || !["INPUT", "TEXTAREA"].includes(field.tagName)) return;

    // Check if it's a sensitive field by name
    if (isSensitiveField(field)) {
      markFieldAsSensitive(field, { label: "Sensitive Field", severity: "medium" });
    }

    // Debounced value scan
    clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => {
      const finding = scanFieldValue(field);
      if (finding) {
        markFieldAsSensitive(field, finding);
        showToast(
          "Sensitive Data Entered",
          `You're typing a <strong>${finding.label}</strong> into this field. PrivacyX is monitoring for your protection.`,
          4000
        );
      }
    }, 800);
  }, true);

  // =========================================================================
  // Initial page scan — mark sensitive fields
  // =========================================================================
  function initialScan() {
    const inputs = document.querySelectorAll("input, textarea");
    inputs.forEach((field) => {
      if (isSensitiveField(field)) {
        markFieldAsSensitive(field, { label: "Sensitive Field", severity: "medium" });
      }
    });
  }

  // Run initial scan after page load
  if (document.readyState === "complete") {
    initialScan();
  } else {
    window.addEventListener("load", initialScan);
  }

  // Watch for dynamically added forms
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const inputs = node.querySelectorAll ? node.querySelectorAll("input, textarea") : [];
          inputs.forEach((field) => {
            if (isSensitiveField(field)) {
              markFieldAsSensitive(field, { label: "Sensitive Field", severity: "medium" });
            }
          });
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  console.log("🛡️ PrivacyX Shield content script active");
})();
