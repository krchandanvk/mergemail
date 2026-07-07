# Universal Mail Merger v2 — Chrome Extension

A **Manifest V3** Chrome Extension that performs mail merges directly inside Gmail, Outlook (Live & Office 365), and Yahoo Mail. Compose personalized drafts for every recipient without leaving your browser.

> **Privacy-first:** Unless you enable Send All mode, nothing is ever sent automatically.

---

## What's New in v2

| Feature | Details |
|---|---|
| 🧩 Template Variables | `{{name}}`, `{{company}}`, `{{role}}`, `{{email}}` — resolved per recipient |
| 📋 CSV Import | Drag-and-drop a CSV; auto-detects email/name/company/role columns |
| 💾 Draft Persistence | Form state saves to `chrome.storage.local` — survives popup close |
| ⚡ Send All Mode | Optional auto-send toggle (with double confirmation) |
| 👁 Live Preview | Preview each resolved email before starting the merge |
| 🔍 Selector Tester | Run all CSS selectors against the live page to find broken ones |
| 🛡️ Injection Guard | Content script registers its listener only once — no duplicate events |

---

## File Structure

```
mergemail/
├── manifest.json              # Extension manifest (MV3, v2.0.0)
├── popup.html                 # Tabbed popup UI
├── popup.js                   # Popup controller v2
├── selectors.js               # CSS selectors per provider + sendButton
├── content.js                 # Automation content script v2
├── sample_recipients.csv      # Example CSV to import
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Installation

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `mergemail/` folder
4. The extension icon appears in your toolbar

---

## Usage

### Basic (plain recipients)

1. Navigate to Gmail, Outlook, or Yahoo Mail in your active tab
2. Open the popup → **Compose** tab
3. Paste recipient emails (one per line or comma-separated)
4. Write subject and body — click **{{variable}}** chips to insert merge fields
5. Click **👁 Preview** to review how each email will look
6. Click **🚀 Start Mail Merge**

### With CSV (personalized merge fields)

1. Prepare a CSV with columns like: `name, company, role, email`
2. Open the popup → **CSV Import** tab
3. Drag-and-drop the CSV (or click to browse)
4. Map columns to merge fields (auto-detected for common names)
5. Click **✅ Apply CSV Data to Compose**
6. Switch to Compose tab, write your template, and start the merge

**Example CSV** → see [`sample_recipients.csv`](./sample_recipients.csv)

**Example template:**
```
Subject: Hi {{name}}, a quick note from us

Body:
Dear {{name}},

I wanted to reach out to you personally regarding your role as {{role}} at {{company}}.
...
```

### Send All Mode

Enable the ⚡ **Send All Automatically** toggle in the Compose tab to send every email immediately instead of leaving them as drafts. You will be asked to confirm twice before this mode activates.

> ⚠️ Use with caution — sent emails cannot be recalled.

---

## Selector Tester

If automation breaks (webmail providers update their DOM frequently):

1. Open the popup → **Selector Test** tab
2. Click **▶ Run All Tests**
3. Each provider shows ✓ Found / ✗ Not found for every selector
4. Update failing selectors in [`selectors.js`](./selectors.js) — no other files need changing

---

## Updating Selectors

All selectors live in [`selectors.js`](./selectors.js). Each field accepts comma-separated fallback selectors:

```js
gmail: {
  composeButton: 'div[gh="cm"]',                         // primary
  bodyField:     'div[aria-label="Message Body"], div.Am.Al.editable', // fallback
  sendButton:    'div[data-tooltip*="Send"]',
  // ...
}
```

---

## Permissions

| Permission | Purpose |
|---|---|
| `activeTab` | Read the current tab URL to detect the provider |
| `scripting` | Inject content scripts into webmail pages |
| `storage` | Persist form state in `chrome.storage.local` |
| Host permissions | Allow scripts to run on Gmail, Outlook, Yahoo |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Could not find Compose button" | Selector stale — use Selector Tester tab, then update `selectors.js` |
| "Could not communicate with page" | Refresh the webmail tab then try again |
| Fields filled but body is empty | `bodyField` selector needs updating; inspect the DOM |
| Duplicate compose windows | Reload the extension at `chrome://extensions/` |
| CSV columns not detected | Make sure CSV uses standard column names (`email`, `name`, `company`, `role`) |
