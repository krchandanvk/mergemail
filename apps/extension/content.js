/**
 * content.js v3 — Universal Mail Merger Automation Script
 *
 * Changes from v2:
 *  - Reports per-recipient timing (startedAt, finishedAt, durationMs)
 *  - Reports individual status: "success" | "failed" per recipient
 *  - Sends UPDATE_RECIPIENT messages to background.js for persistent tracking
 *  - Injection guard prevents double-registration
 *
 * Dependencies: selectors.js (MAIL_SELECTORS, detectProvider)
 */

if (!window.__mailMergerV3Loaded) {
  window.__mailMergerV3Loaded = true;

// ─── Utilities ───────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function queryFirst(selectorString, context = document) {
  for (const sel of selectorString.split(",").map((s) => s.trim())) {
    try {
      const el = context.querySelector(sel);
      if (el) return el;
    } catch (_) {}
  }
  return null;
}

/**
 * Wait for element using MutationObserver with polling fallback.
 */
function waitForElement(selectorString, timeoutMs = 6000, context = document) {
  return new Promise((resolve) => {
    const existing = queryFirst(selectorString, context);
    if (existing) return resolve(existing);

    let settled = false;
    const done = (el) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timer);
      resolve(el);
    };

    const observer = new MutationObserver(() => {
      const el = queryFirst(selectorString, context);
      if (el) done(el);
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    const timer = setTimeout(() => done(null), timeoutMs);
  });
}

function nativeInputValue(element, value) {
  const inputSetter    = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,   "value")?.set;
  const textareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;

  if (element.tagName === "INPUT" && inputSetter) {
    inputSetter.call(element, value);
  } else if (element.tagName === "TEXTAREA" && textareaSetter) {
    textareaSetter.call(element, value);
  } else {
    element.focus();
    document.execCommand("selectAll", false, null);
    document.execCommand("insertText", false, value);
    return;
  }
  element.dispatchEvent(new Event("input",  { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function setBodyContent(element, text) {
  element.focus();
  document.execCommand("selectAll", false, null);
  document.execCommand("insertHTML", false, text);
  element.dispatchEvent(new InputEvent("input", { bubbles: true }));
}

function reportStatus(payload) {
  try { chrome.runtime.sendMessage({ type: "MERGE_STATUS", ...payload }); } catch (_) {}
}

function saveToCampaign(campaignId, result) {
  if (!campaignId) return;
  try {
    chrome.runtime.sendMessage({ type: "UPDATE_RECIPIENT", campaignId, result });
  } catch (_) {}
}

// ─── Single Compose ───────────────────────────────────────────────────────────

async function composeOne(selectors, email, subject, body, autoSend) {
  const composeBtn = queryFirst(selectors.composeButton);
  if (!composeBtn) {
    return `Could not find the Compose button for ${selectors.name}.\nSelector: "${selectors.composeButton}"`;
  }
  composeBtn.click();

  const composeWindow = await waitForElement(selectors.composeWindow, 8000);
  if (!composeWindow) {
    return `Compose window did not appear for ${selectors.name}.\nSelector: "${selectors.composeWindow}"`;
  }
  await sleep(700);

  const toField = await waitForElement(selectors.toField, 5000);
  if (!toField) {
    return `Could not find the To field for ${selectors.name}.\nSelector: "${selectors.toField}"`;
  }
  toField.focus();
  nativeInputValue(toField, email);
  await sleep(350);
  toField.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab",  keyCode: 9,  bubbles: true }));
  toField.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter",keyCode: 13, bubbles: true }));
  await sleep(250);

  const subjectField = await waitForElement(selectors.subjectField, 5000);
  if (!subjectField) {
    return `Could not find the Subject field for ${selectors.name}.\nSelector: "${selectors.subjectField}"`;
  }
  subjectField.focus();
  nativeInputValue(subjectField, subject);
  await sleep(200);

  const bodyField = await waitForElement(selectors.bodyField, 5000);
  if (!bodyField) {
    return `Could not find the Body field for ${selectors.name}.\nSelector: "${selectors.bodyField}"`;
  }
  setBodyContent(bodyField, body);
  await sleep(300);

  if (autoSend && selectors.sendButton) {
    const sendBtn = await waitForElement(selectors.sendButton, 4000);
    if (sendBtn) { sendBtn.click(); await sleep(500); }
  }

  return null;
}

// ─── Main Message Listener ────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "START_MERGE") return;

  const { resolved, autoSend, campaignId, interval } = message;
  const mergeStart = Date.now();

  (async () => {
    const selectors = detectProvider();
    if (!selectors) {
      reportStatus({ done: true, error: "Unsupported page. Navigate to Gmail, Outlook, or Yahoo Mail." });
      return;
    }

    const DELAY_BETWEEN = interval || 1500;

    for (let i = 0; i < resolved.length; i++) {
      const { email, subject, body } = resolved[i];
      if (!email) continue;

      const startedAt = new Date().toISOString();
      const t0 = Date.now();

      reportStatus({
        done: false,
        current: i + 1,
        total:   resolved.length,
        recipient: email,
      });

      const err = await composeOne(selectors, email, subject, body, autoSend);
      const finishedAt  = new Date().toISOString();
      const durationMs  = Date.now() - t0;

      // Persist per-recipient result
      saveToCampaign(campaignId, {
        email,
        status:     err ? "failed" : "success",
        error:      err || null,
        startedAt,
        finishedAt,
        durationMs,
      });

      if (err) {
        reportStatus({ done: true, error: `⚠️ ${err}`, campaignId });
        // Finalize campaign as partial (some succeeded before failure)
        chrome.runtime.sendMessage({
          type:       "FINALIZE_CAMPAIGN",
          campaignId,
          status:     i === 0 ? "failed" : "partial",
          durationMs: Date.now() - mergeStart,
        });
        return;
      }

      reportStatus({ done: false, current: i + 1, total: resolved.length, recipient: email });

      if (i < resolved.length - 1) await sleep(DELAY_BETWEEN);
    }

    chrome.runtime.sendMessage({
      type:       "FINALIZE_CAMPAIGN",
      campaignId,
      status:     "completed",
      durationMs: Date.now() - mergeStart,
    });

    reportStatus({ done: true, success: true, total: resolved.length, campaignId });
  })();

  sendResponse({ ack: true });
  return true;
});

} // end guard
