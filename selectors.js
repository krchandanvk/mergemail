/**
 * selectors.js v2 — Modular DOM Selector Configuration
 *
 * Defines CSS selectors for each supported webmail provider.
 * Update selectors HERE if a provider changes its DOM structure —
 * no other files need editing.
 *
 * Fields per provider:
 *   name          — Human-readable provider name (used in error messages)
 *   composeButton — Button/link that opens a new compose window
 *   composeWindow — Sentinel element confirming the compose pane is open
 *   toField       — The "To:" recipient input
 *   subjectField  — The subject line input
 *   bodyField     — The rich-text / contenteditable message body
 *   sendButton    — The Send button (used only in autoSend mode)
 *
 * Selector strings may be comma-separated lists of fallback selectors;
 * the first one that matches a real element wins.
 */

const MAIL_SELECTORS = {

  // ── Gmail ──────────────────────────────────────────────────────────────────
  gmail: {
    name:          "Gmail",
    composeButton: 'div[gh="cm"]',
    composeWindow: '.aDh, .nH .no',
    toField:       'input[name="to"], textarea[name="to"]',
    subjectField:  'input[name="subjectbox"]',
    bodyField:     'div[aria-label="Message Body"], div.Am.Al.editable',
    sendButton:    'div[data-tooltip*="Send"], div[aria-label*="Send"]',
  },

  // ── Outlook Live (outlook.live.com) ────────────────────────────────────────
  outlook_live: {
    name:          "Outlook (Live)",
    composeButton: 'button[data-automation-id="newMailButton"], button[aria-label="New mail"], button[title="New mail"]',
    composeWindow: 'div[role="dialog"], div[data-app-section="ComposePane"]',
    toField:       'div[aria-label="To"] input, input[aria-label="To"], div[class*="wellItemText"] input',
    subjectField:  'input[aria-label="Add a subject"], input[placeholder*="subject" i]',
    bodyField:     'div[aria-label="Message body, press Alt+F10 to exit"], div[contenteditable="true"][aria-multiline="true"]',
    sendButton:    'button[aria-label="Send"], button[data-automation-id="sendButton"]',
  },

  // ── Outlook Office 365 (outlook.office365.com) ─────────────────────────────
  outlook_office: {
    name:          "Outlook (Office 365)",
    composeButton: 'button[data-automation-id="newMailButton"], button[aria-label="New mail"], button[title="New mail"]',
    composeWindow: 'div[role="dialog"], div[aria-label="New message"], div[data-app-section="ComposePane"]',
    toField:       'div[aria-label="To"] input, input[aria-label="To"]',
    subjectField:  'input[aria-label="Add a subject"], input[placeholder*="subject" i]',
    bodyField:     'div[aria-label="Message body, press Alt+F10 to exit"], div[contenteditable="true"][aria-multiline="true"]',
    sendButton:    'button[aria-label="Send"], button[data-automation-id="sendButton"]',
  },

  // ── Yahoo Mail (mail.yahoo.com / *.mail.yahoo.com) ─────────────────────────
  yahoo: {
    name:          "Yahoo Mail",
    composeButton: 'a[data-test-id="compose-button"], a[href*="compose"], button[data-test-id="compose-button"]',
    composeWindow: 'div[data-test-id="compose-view"], div[class*="compose-container"]',
    toField:       'input#message-to-field, input[aria-label="To"], input[data-test-id="compose-to-field"]',
    subjectField:  'input#message-subject, input[data-test-id="compose-subject"], input[aria-label="Subject"]',
    bodyField:     'div[aria-label="Message body"], div[contenteditable="true"][data-test-id="compose-editor-container"], div[data-test-id="rte"]',
    sendButton:    'button[data-test-id="compose-send-button"], button[title="Send"]',
  },

};

/**
 * Detects the current webmail provider from window.location.
 * Returns the matching selectors config object, or null if not on a supported site.
 */
function detectProvider() {
  const host = window.location.hostname;
  if (host === "mail.google.com")                                   return MAIL_SELECTORS.gmail;
  if (host === "outlook.live.com")                                  return MAIL_SELECTORS.outlook_live;
  if (host === "outlook.office365.com")                             return MAIL_SELECTORS.outlook_office;
  if (host === "mail.yahoo.com" || host.endsWith(".mail.yahoo.com")) return MAIL_SELECTORS.yahoo;
  return null;
}
