/**
 * popup.js v4 — Universal Mail Merger Popup Controller
 * ES Module entry point — imports all service classes.
 *
 * Architecture:
 *   Services  → pure business logic (no DOM)
 *   popup.js  → thin controller (DOM wiring + state)
 *   content.js → automation (receives pre-resolved emails)
 */

import { CSVParser }           from './services/csv-parser.js';
import { ColumnMapper, STANDARD_FIELDS } from './services/column-mapper.js';
import { MergeFieldService }   from './services/merge-field-service.js';
import { TemplateRenderer }    from './services/template-renderer.js';
import { RecipientValidator }  from './services/recipient-validator.js';
import { EmailGenerator }      from './services/email-generator.js';

// ─── Background Messaging ─────────────────────────────────────────────────────
const bg = (type, payload = {}) =>
  new Promise(res => chrome.runtime.sendMessage({ type, ...payload }, res));

// ─── App State ────────────────────────────────────────────────────────────────
const state = {
  // CSV
  csvFileName:  '',
  csvHeaders:   [],
  csvRows:      [],      // raw CSV rows { header: value }
  csvMappings:  {},      // { header → mergeKey | 'ignore' }

  // Resolved data
  mergeFields:  [],      // MergeField[] — drives chips
  recipientRows:[],      // { mergeKey: value }[] — ready for EmailGenerator
  mode:         'email', // 'csv' | 'email'

  // Email-only settings
  extractNames: true,

  // Campaign
  activeCampaignId: null,
  mergeStartTime:   null,
};

// ─── DOM Helpers ──────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const saveStateKeys = ['recipients', 'subject', 'body', 'sendAll', 'campaignName', 'sendInterval'];

// ─── Tab Navigation ───────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    $(`panel-${btn.dataset.tab}`).classList.add('active');
    if (btn.dataset.tab === 'campaigns') loadCampaignHistory();
  });
});

// ─── Persistence ──────────────────────────────────────────────────────────────
function saveState() {
  chrome.storage.local.set({
    recipients:   $('recipients').value,
    subject:      $('subject').value,
    body:         $('bodyEditor').innerHTML,
    sendAll:      $('sendAllToggle').checked,
    campaignName: $('campaignName').value,
    sendInterval: $('sendIntervalInput').value,
  });
}

async function restoreState() {
  const data = await chrome.storage.local.get(saveStateKeys);
  if (data.recipients)   $('recipients').value   = data.recipients;
  if (data.subject)      $('subject').value       = data.subject;
  if (data.body)         $('bodyEditor').innerHTML = data.body;
  if (data.sendAll)      $('sendAllToggle').checked = data.sendAll;
  if (data.sendInterval) $('sendIntervalInput').value = data.sendInterval;
  $('campaignName').value = data.campaignName || generateCampaignName();
  updateCharCount();
  onRecipientsChange();
}

function generateCampaignName() {
  const now = new Date();
  return `Campaign — ${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

// ─── Compose Tab: Basic Events ────────────────────────────────────────────────
$('campaignName').addEventListener('input', saveState);
$('subject').addEventListener('input', () => { saveState(); runLiveValidation(); refreshPreview(); });
$('body').addEventListener('input', () => { saveState(); updateCharCount(); runLiveValidation(); refreshPreview(); });
$('recipients').addEventListener('input', () => { saveState(); onRecipientsChange(); });
$('extractNamesCheck').addEventListener('change', () => {
  state.extractNames = $('extractNamesCheck').checked;
  onRecipientsChange();
});
$('sendIntervalInput').addEventListener('input', saveState);

// ─── WYSIWYG Editor Actions ──────────────────────────────────────────────────
document.querySelectorAll('.editor-btn[data-cmd]').forEach(btn => {
  btn.addEventListener('click', () => {
    const cmd = btn.dataset.cmd;
    document.execCommand(cmd, false, null);
    $('bodyEditor').focus();
    saveState();
    updateCharCount();
    runLiveValidation();
    refreshPreview();
  });
});

$('editorLinkBtn').addEventListener('click', () => {
  const url = prompt('Enter URL:');
  if (url) {
    document.execCommand('createLink', false, url);
  }
  $('bodyEditor').focus();
  saveState();
  updateCharCount();
  runLiveValidation();
  refreshPreview();
});

$('bodyEditor').addEventListener('input', () => {
  saveState();
  updateCharCount();
  runLiveValidation();
  refreshPreview();
});

// ─── Device Switcher Actions ─────────────────────────────────────────────────
document.querySelectorAll('.device-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const wrap = $('previewFrameWrap');
    if (btn.dataset.device === 'mobile') {
      wrap.classList.add('mobile');
    } else {
      wrap.classList.remove('mobile');
    }
  });
});

function updateCharCount() {
  $('charCount').textContent = $('bodyEditor').innerText.length + ' chars';
}

// ─── Recipient Mode Management ────────────────────────────────────────────────
function onRecipientsChange() {
  if (state.mode === 'csv') return; // CSV drives everything, ignore manual text
  buildEmailModeRows();
  renderChips();
  updateRecipientBadge();
  runLiveValidation();
  rebuildPreviewDropdown();
}

function buildEmailModeRows() {
  const raw    = $('recipients').value;
  const emails = parseEmailList(raw);
  state.recipientRows = EmailGenerator.fromEmails(emails, state.extractNames);
  state.mergeFields   = MergeFieldService.forEmailOnly(state.extractNames);
}

function parseEmailList(raw) {
  return raw.split(/[\n,]+/).map(e => e.trim()).filter(Boolean);
}

function updateRecipientBadge() {
  const badge = $('recipientBadge');
  const count = state.recipientRows.length;
  if (count > 0) {
    badge.textContent  = `${count} recipient${count !== 1 ? 's' : ''}`;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

// ─── Mode: email vs CSV ───────────────────────────────────────────────────────
function setMode(mode) {
  state.mode = mode;
  const isCsv   = mode === 'csv';

  // Show/hide recipient areas
  $('csvSourceBox').classList.toggle('visible', isCsv);
  $('recipients').style.display       = isCsv ? 'none' : 'block';
  $('emailModeBanner').classList.toggle('visible', !isCsv);

  if (isCsv) {
    renderCsvSourceBox();
  } else {
    buildEmailModeRows();
    renderChips();
    updateRecipientBadge();
  }
  runLiveValidation();
  rebuildPreviewDropdown();
}

function renderCsvSourceBox() {
  const count = state.recipientRows.length;
  $('csvSourceTitle').textContent = `📋 ${count} recipient${count !== 1 ? 's' : ''} from CSV`;

  // Mapped fields summary
  const standardMapped = state.mergeFields.filter(f => f.isStandard).map(f => `✓ ${f.label}`);
  const customMapped   = state.mergeFields.filter(f => !f.isStandard).map(f => `{{${f.key}}}`);
  $('csvSourceMeta').textContent = [
    `${state.csvHeaders.length} columns`,
    ...standardMapped,
  ].join(' · ');

  // Field chips
  const chipsEl = $('csvFieldChips');
  chipsEl.innerHTML = '';
  state.mergeFields.forEach(f => {
    const chip = document.createElement('span');
    chip.className   = 'merge-chip available';
    chip.textContent = `{{${f.key}}}`;
    chip.style.fontSize = '9px';
    chipsEl.appendChild(chip);
  });

  updateRecipientBadge();
}

// ─── Dynamic Chips ────────────────────────────────────────────────────────────
function renderChips() {
  const wrap    = $('chipsWrap');
  const fields  = state.mergeFields;
  const subject = $('subject').value;
  const body    = $('body').value;
  const usedVars = new Set([
    ...TemplateRenderer.extractVars(subject),
    ...TemplateRenderer.extractVars(body),
  ]);

  if (!fields.length) {
    const hasEmails = state.recipientRows.length > 0;
    wrap.innerHTML = hasEmails
      ? '<span class="chips-empty">Upload a CSV to enable {{name}}, {{company}}, and more</span>'
      : '<span class="chips-empty">Upload a CSV or enter emails to enable merge fields</span>';
    return;
  }

  wrap.innerHTML = '';
  fields.forEach(field => {
    const chip    = document.createElement('span');
    chip.dataset.key = field.key;
    chip.textContent = `{{${field.key}}}`;
    chip.title       = `${field.label} — from CSV column "${field.csvHeader}"`;

    if (field.isEstimated) {
      chip.className = 'merge-chip estimated';
      chip.title += ' (Estimated from email address)';
    } else {
      chip.className = 'merge-chip available';
    }

    chip.addEventListener('click', () => insertAtCursor($('body'), `{{${field.key}}}`));
    wrap.appendChild(chip);
  });

  // Show unavailable standard fields as disabled chips
  const availableKeys = new Set(fields.map(f => f.key));
  STANDARD_FIELDS.filter(k => !availableKeys.has(k)).forEach(k => {
    const chip    = document.createElement('span');
    chip.className   = 'merge-chip unavailable';
    chip.textContent = `{{${k}}}`;
    chip.title       = `Upload a CSV with a "${k}" column to enable this`;
    wrap.appendChild(chip);
  });
}

function insertAtCursor(editor, text) {
  editor.focus();
  const sel = window.getSelection();
  if (sel && sel.getRangeAt && sel.rangeCount) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    
    // Move caret after inserted text
    range.setStartAfter(node);
    range.setEndAfter(node);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    editor.innerHTML += text;
  }
  saveState();
  runLiveValidation();
  refreshPreview();
}

// Preview Panel click listener removed as it is permanently visible

function rebuildPreviewDropdown() {
  const sel   = $('previewSelect');
  const rows  = state.recipientRows;
  sel.innerHTML = '<option value="-1">— select recipient —</option>';
  rows.forEach((row, i) => {
    const label = row.name
      ? `${row.name} (${row.email})`
      : (row.email || `Row ${i + 1}`);
    const opt   = document.createElement('option');
    opt.value   = i;
    opt.textContent = label;
    sel.appendChild(opt);
  });
  if (rows.length === 1) sel.value = '0';
  $('previewCounter').textContent = rows.length ? `${rows.length} recipient${rows.length !== 1 ? 's' : ''}` : '';
  refreshPreview();
}

$('previewSelect').addEventListener('change', refreshPreview);

function refreshPreview() {
  const idx  = parseInt($('previewSelect').value, 10);
  const row  = (idx >= 0 && state.recipientRows[idx]) ? state.recipientRows[idx] : null;

  if (!row) {
    $('previewSubjectEl').innerHTML = '<span style="color:var(--text-dim)">Select a recipient to preview</span>';
    $('previewBodyEl').innerHTML    = '';
    return;
  }

  const prev = EmailGenerator.previewOne(row, $('subject').value, $('bodyEditor').innerHTML);
  $('previewSubjectEl').innerHTML = prev.subjectHtml;
  $('previewBodyEl').innerHTML    = prev.bodyHtml;
}

// ─── Live Validation ──────────────────────────────────────────────────────────
function runLiveValidation() {
  const panel       = $('validationPanel');
  const subject     = $('subject').value;
  const body        = $('bodyEditor').innerHTML;
  const availKeys   = state.mergeFields.map(f => f.key);
  const { errors, warnings } = RecipientValidator.validate(
    state.recipientRows, subject, body, availKeys
  );

  // Filter out NO_RECIPIENTS / INVALID_EMAIL for live-validation (don't nag while typing)
  const displayErrors   = errors.filter(e => e.code === 'MISSING_MERGE_FIELD');
  const displayWarnings = warnings;

  if (!displayErrors.length && !displayWarnings.length) {
    panel.innerHTML = '';
    return;
  }

  panel.innerHTML = [
    ...displayErrors.map(e => vItem('error', '🚫', e.message, e.hint)),
    ...displayWarnings.map(w => vItem('warning', '⚠️', w.message, w.hint)),
  ].join('');
}

function vItem(type, icon, msg, hint = '') {
  return `<div class="v-item ${type}">
    <span class="v-icon">${icon}</span>
    <div class="v-body">
      <div class="v-msg">${escHtml(msg)}</div>
      ${hint ? `<div class="v-hint">${escHtml(hint)}</div>` : ''}
    </div>
  </div>`;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── Send All Toggle ──────────────────────────────────────────────────────────
$('sendAllToggle').addEventListener('change', () => {
  if ($('sendAllToggle').checked) {
    const ok = confirm('⚠️ SEND ALL MODE\n\nThis will SEND every email automatically — not just create drafts.\n\nCannot be undone. Continue?');
    if (!ok) $('sendAllToggle').checked = false;
  }
  saveState();
});

// ─── Reports Button ───────────────────────────────────────────────────────────
$('openReportsBtn').addEventListener('click', () => bg('OPEN_REPORTS'));

// ─── Clear CSV ────────────────────────────────────────────────────────────────
function clearCsv() {
  state.csvFileName  = '';
  state.csvHeaders   = [];
  state.csvRows      = [];
  state.csvMappings  = {};
  state.mergeFields  = [];
  state.recipientRows = [];
  state.mode         = 'email';

  $('csvFileInfo').classList.remove('visible');
  $('mappingSection').classList.remove('visible');
  $('csvFileInput').value = '';

  setMode('email');
  renderChips();
  runLiveValidation();
}
$('clearCsvBtn').addEventListener('click', clearCsv);

// ══════════════════════════════════════════════════════════════════
//  START MERGE
// ══════════════════════════════════════════════════════════════════
$('startBtn').addEventListener('click', async () => {
  const subject  = $('subject').value.trim();
  const bodyText = $('bodyEditor').innerText.trim();
  const bodyHtml = $('bodyEditor').innerHTML;
  const autoSend = $('sendAllToggle').checked;

  if (!subject)  { setStatus('error', 'Subject cannot be empty.'); return; }
  if (!bodyText) { setStatus('error', 'Message body cannot be empty.'); return; }

  // Final validation (full — including email checks)
  const availKeys  = state.mergeFields.map(f => f.key);
  const validation = RecipientValidator.validate(state.recipientRows, subject, bodyHtml, availKeys);

  if (!validation.valid) {
    $('validationPanel').innerHTML = validation.errors.map(e =>
      vItem('error', '🚫', e.message, e.hint)
    ).join('');
    setStatus('error', `Fix ${validation.errors.length} error(s) before continuing.`);
    return;
  }

  if (validation.warnings.length > 0) {
    const proceed = confirm(
      'Warnings:\n' + validation.warnings.map(w => '• ' + w.message).join('\n') +
      '\n\nProceed anyway?'
    );
    if (!proceed) return;
  }

  if (state.recipientRows.length > 10) {
    const verb = autoSend ? 'send' : 'draft';
    if (!confirm(`About to ${verb} ${state.recipientRows.length} emails. Continue?`)) return;
  }

  // Detect active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) { setStatus('error', 'Cannot detect active tab.'); return; }

  const SUPPORTED = ['mail.google.com','outlook.live.com','outlook.office365.com','mail.yahoo.com'];
  const tabHost   = new URL(tab.url).hostname;
  if (!SUPPORTED.some(h => tabHost === h || tabHost.endsWith('.' + h))) {
    setStatus('error', 'Please open Gmail, Outlook, or Yahoo Mail in your active tab first.'); return;
  }

  const PROVIDER_MAP = {
    'mail.google.com':       'Gmail',
    'outlook.live.com':      'Outlook (Live)',
    'outlook.office365.com': 'Outlook (Office 365)',
    'mail.yahoo.com':        'Yahoo Mail',
  };
  const provider = PROVIDER_MAP[tabHost] ||
    Object.entries(PROVIDER_MAP).find(([h]) => tabHost.endsWith('.' + h))?.[1] || 'Unknown';

  // Inject content scripts
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['selectors.js','content.js'] });
  } catch (_) {}

  // Generate resolved emails (one per recipient)
  const resolved = EmailGenerator.generate(state.recipientRows, subject, bodyHtml);

  if (!resolved.length) { setStatus('error', 'No valid emails to send.'); return; }

  // Create campaign record
  const campName = $('campaignName').value.trim() || generateCampaignName();
  const campRes  = await bg('SAVE_CAMPAIGN', {
    campaign: {
      name: campName, provider, mode: autoSend ? 'send' : 'draft',
      subject, body: bodyHtml, totalCount: resolved.length,
    }
  });
  state.activeCampaignId = campRes?.id || null;
  state.mergeStartTime   = Date.now();

  lockUI(true);
  resetProgress();
  setStatus('running', `Starting "${campName}" — ${resolved.length} recipient(s)…`);

  try {
    const rawInterval = parseInt($('sendIntervalInput').value, 10);
    const intervalMs  = Math.max(1, isNaN(rawInterval) ? 3 : rawInterval) * 1000;

    await chrome.tabs.sendMessage(tab.id, {
      type: 'START_MERGE',
      resolved: resolved.map(r => ({ email: r.email, subject: r.subject, body: r.body })),
      autoSend,
      campaignId: state.activeCampaignId,
      interval: intervalMs,
    });
  } catch (err) {
    lockUI(false);
    setStatus('error', 'Could not communicate with the page. Refresh the webmail tab and try again.');
    if (state.activeCampaignId) {
      bg('FINALIZE_CAMPAIGN', { campaignId: state.activeCampaignId, status: 'failed', durationMs: 0 });
    }
  }
});

// ─── Status Listener ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener(message => {
  if (message.type !== 'MERGE_STATUS') return;
  if (message.error) {
    lockUI(false); resetProgress();
    setStatus('error', message.error);
    return;
  }
  if (message.done && message.success) {
    lockUI(false);
    updateProgress(message.total, message.total);
    const mode = $('sendAllToggle').checked ? 'sent' : 'draft(s) created';
    setStatus('success', `✓ All ${message.total} emails ${mode}! Campaign saved to Reports.`);
    $('campaignName').value = generateCampaignName();
    saveState();
    return;
  }
  updateProgress(message.current, message.total);
  setStatus('running', `Drafting ${message.current} of ${message.total}: ${message.recipient}`);
});

function setStatus(type, msg) {
  const box = $('statusBox');
  box.className = 'status-box ' + type;
  $('statusIcon').textContent = { running:'⏳', success:'✅', error:'❌', idle:'ℹ️' }[type] || 'ℹ️';
  $('statusText').textContent = msg;
  box.style.display = 'flex';
}

function updateProgress(cur, total) {
  const pct = total > 0 ? Math.round((cur / total) * 100) : 0;
  $('progressBar').style.display = 'block';
  $('progressFill').style.width  = pct + '%';
}
function resetProgress() { $('progressBar').style.display = 'none'; $('progressFill').style.width = '0%'; }
function lockUI(locked) {
  $('bodyEditor').contentEditable = locked ? 'false' : 'true';
  [$('startBtn'), $('recipients'), $('subject'), $('sendAllToggle'), $('sendIntervalInput')].forEach(el => el.disabled = locked);
  $('startBtn').textContent = locked ? '⏳ Running…' : '🚀 Start Mail Merge';
}

// ══════════════════════════════════════════════════════════════════
//  CSV TAB
// ══════════════════════════════════════════════════════════════════
const csvDropZone = $('csvDropZone');
const csvFileInput = $('csvFileInput');

csvDropZone.addEventListener('click',   () => csvFileInput.click());
csvDropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') csvFileInput.click(); });
csvDropZone.addEventListener('dragover', e => { e.preventDefault(); csvDropZone.classList.add('drag-over'); });
csvDropZone.addEventListener('dragleave', () => csvDropZone.classList.remove('drag-over'));
csvDropZone.addEventListener('drop', e => {
  e.preventDefault();
  csvDropZone.classList.remove('drag-over');
  const f = e.dataTransfer.files[0];
  if (f) loadCsvFile(f);
});
csvFileInput.addEventListener('change', () => { if (csvFileInput.files[0]) loadCsvFile(csvFileInput.files[0]); });
$('csvRemoveBtn').addEventListener('click', clearCsv);

function loadCsvFile(file) {
  state.csvFileName = file.name;
  const reader = new FileReader();
  reader.onload = e => processCSVText(e.target.result, file.name);
  reader.onerror = () => alert('Could not read the file. Make sure it is a valid CSV.');
  reader.readAsText(file, 'UTF-8');
}

function processCSVText(text, name = 'file.csv') {
  const { headers, rows } = CSVParser.parse(text);

  if (!headers.length) {
    alert('Could not parse CSV. Make sure the file has a header row and is comma-separated.');
    return;
  }
  if (!rows.length) {
    alert('The CSV appears to have no data rows. Add at least one recipient row.');
    return;
  }

  state.csvHeaders  = headers;
  state.csvRows     = rows;
  const { mappings, unmapped } = ColumnMapper.autoDetect(headers);
  state.csvMappings = mappings;

  // Show file info
  $('csvFileInfo').classList.add('visible');
  $('csvFileName').textContent  = name;
  $('csvFileStats').textContent = `${rows.length} row${rows.length !== 1 ? 's' : ''} · ${headers.length} column${headers.length !== 1 ? 's' : ''} · ${unmapped.length} custom field${unmapped.length !== 1 ? 's' : ''}`;

  renderMappingTable();
  renderMappingSummary();
  $('mappingSection').classList.add('visible');
  $('downloadSampleBtnEmpty').style.display = 'none';
}

// ─── Mapping Table ────────────────────────────────────────────────────────────
function renderMappingTable() {
  const tbody = $('mappingTbody');
  tbody.innerHTML = '';

  state.csvHeaders.forEach(header => {
    const currentKey = state.csvMappings[header] || ColumnMapper.toMergeKey(header);
    const isAuto     = Object.values({ name:'name',email:'email',company:'company',role:'role' }).includes(currentKey);
    const isIgnored  = currentKey === 'ignore';

    const tr = document.createElement('tr');

    // Status dot
    const tdStatus = document.createElement('td');
    tdStatus.className = 'map-status';
    tdStatus.textContent = isIgnored ? '–' : isAuto ? '✓' : '⚙';
    tdStatus.title = isIgnored ? 'Ignored' : isAuto ? 'Auto-detected' : 'Custom field';
    tr.appendChild(tdStatus);

    // Header name
    const tdHeader = document.createElement('td');
    tdHeader.className = 'map-header';
    tdHeader.textContent = header;
    tr.appendChild(tdHeader);

    // Maps-to dropdown
    const tdSelect = document.createElement('td');
    const sel = document.createElement('select');
    sel.className = 'map-select';
    sel.innerHTML = `
      <optgroup label="Standard Fields">
        <option value="name"    ${currentKey==='name'    ?'selected':''}>Name  {{name}}</option>
        <option value="email"   ${currentKey==='email'   ?'selected':''}>Email  {{email}}</option>
        <option value="company" ${currentKey==='company' ?'selected':''}>Company  {{company}}</option>
        <option value="role"    ${currentKey==='role'    ?'selected':''}>Role  {{role}}</option>
      </optgroup>
      <optgroup label="Custom">
        <option value="${ColumnMapper.toMergeKey(header)}"
          ${!STANDARD_FIELDS.includes(currentKey) && currentKey !== 'ignore' ? 'selected':''}>
          Custom: {{${ColumnMapper.toMergeKey(header)}}}
        </option>
      </optgroup>
      <optgroup label="Other">
        <option value="ignore" ${currentKey==='ignore'?'selected':''}>— Ignore column —</option>
      </optgroup>
    `;
    sel.addEventListener('change', () => {
      state.csvMappings[header] = sel.value;
      // Update status dot
      const newKey = sel.value;
      tdStatus.textContent = newKey === 'ignore' ? '–' : STANDARD_FIELDS.includes(newKey) ? '✓' : '⚙';
      // Update key chip
      tdKey.textContent = newKey === 'ignore' ? '—' : `{{${newKey}}}`;
      tdKey.className   = 'map-key' + (newKey === 'ignore' ? ' ignored' : '');
      renderMappingSummary();
    });
    tdSelect.appendChild(sel);
    tr.appendChild(tdSelect);

    // Key preview
    const tdKey = document.createElement('td');
    tdKey.className   = 'map-key' + (isIgnored ? ' ignored' : '');
    tdKey.textContent = isIgnored ? '—' : `{{${currentKey}}}`;
    tr.appendChild(tdKey);

    tbody.appendChild(tr);
  });
}

// ─── Mapping Summary ──────────────────────────────────────────────────────────
function renderMappingSummary() {
  const summary = $('mappingSummary');
  const activeKeys = ColumnMapper.getActiveKeys(state.csvMappings);
  const standardKeys = activeKeys.filter(k => STANDARD_FIELDS.includes(k));
  const customKeys   = activeKeys.filter(k => !STANDARD_FIELDS.includes(k));

  summary.innerHTML = `
    <div class="summary-label">Mapped Fields</div>
    <div class="summary-row">
      ${standardKeys.map(k => `<span class="summary-chip standard">✓ ${MergeFieldService.keyToLabel(k)}</span>`).join('')}
      ${customKeys.map(k => `<span class="summary-chip custom">{{${k}}}</span>`).join('')}
      ${!activeKeys.length ? '<span style="font-size:10.5px;color:var(--text-dim)">No columns mapped</span>' : ''}
    </div>
    <div class="summary-label" style="margin-top:4px">Available Merge Variables</div>
    <div class="summary-row">
      ${activeKeys.map(k => `<span class="summary-chip custom">{{${k}}}</span>`).join('')}
    </div>
  `;
}

// ─── Apply CSV to Compose ─────────────────────────────────────────────────────
$('applyCsvBtn').addEventListener('click', applyCSV);

function applyCSV() {
  // Validate email column exists
  const emailKey = Object.values(state.csvMappings).find(k => k === 'email');
  if (!emailKey) {
    alert('Please map one column to "Email" before applying.');
    return;
  }

  // Build recipient rows using service
  state.recipientRows = EmailGenerator.fromCSV(state.csvRows, state.csvMappings);

  // Generate merge fields
  state.mergeFields = MergeFieldService.generateFields(state.csvHeaders, state.csvMappings);

  state.mode = 'csv';

  // Switch to Compose tab
  document.querySelector('[data-tab="compose"]').click();

  // Update UI
  setMode('csv');
  renderChips();
  updateRecipientBadge();
  rebuildPreviewDropdown();
  runLiveValidation();
  setStatus('idle', `✓ ${state.recipientRows.length} recipient(s) loaded from CSV. Variables: ${state.mergeFields.map(f=>`{{${f.key}}}`).join(', ')}`);
  $('statusBox').style.display = 'flex';
}

// ─── Sample CSV Download ──────────────────────────────────────────────────────
function downloadSampleCSV() {
  const csv  = CSVParser.sampleCSV();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'sample-recipients.csv'; a.click();
  URL.revokeObjectURL(url);
}
$('downloadSampleBtn').addEventListener('click', downloadSampleCSV);
$('downloadSampleBtnEmpty').addEventListener('click', downloadSampleCSV);

// ══════════════════════════════════════════════════════════════════
//  CAMPAIGNS TAB
// ══════════════════════════════════════════════════════════════════
async function loadCampaignHistory() {
  const res       = await bg('GET_CAMPAIGNS');
  const campaigns = res?.campaigns || [];
  const totalS    = campaigns.reduce((s,c) => s + (c.stats?.success||0), 0);
  const totalAll  = campaigns.reduce((s,c) => s + (c.stats?.total||0), 0);
  const rate      = totalAll > 0 ? Math.round((totalS/totalAll)*100) : 0;

  $('qCampaigns').textContent = campaigns.length || '0';
  $('qDrafted').textContent   = totalS || '0';
  $('qRate').textContent      = totalAll ? rate + '%' : '—';

  const list = $('campHistoryList');
  if (!campaigns.length) {
    list.innerHTML = '<div class="camp-empty">No campaigns yet. Run a merge to see history here.</div>';
    return;
  }
  list.innerHTML = campaigns.slice(0, 8).map(c => {
    const total   = c.stats?.total   || 0;
    const success = c.stats?.success || 0;
    const pct     = total > 0 ? Math.round((success/total)*100) : 0;
    const date    = c.createdAt
      ? new Date(c.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})
      : '';
    const statusEmoji = {completed:'✓',partial:'⚠',failed:'✗',running:'⏳'}[c.status] || '⏳';
    return `
      <div class="camp-card">
        <div class="camp-card-top">
          <div class="camp-card-name" title="${escHtml(c.name||'Untitled')}">${escHtml(c.name||'Untitled')}</div>
          <span class="camp-pill ${c.status||'running'}">${statusEmoji} ${c.status||'running'}</span>
        </div>
        <div class="camp-meta">
          <span>${escHtml(c.provider||'—')}</span>·
          <span>${success}/${total}</span>
          <div class="camp-mini-bar"><div class="camp-mini-fill" style="width:${pct}%"></div></div>
          <span>${pct}%</span>
          <span style="margin-left:auto">${date}</span>
        </div>
      </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════════════════
//  SELECTOR TESTER TAB
// ══════════════════════════════════════════════════════════════════
const ALL_PROVIDERS  = ['gmail','outlook_live','outlook_office','yahoo'];
const PROVIDER_NAMES = { gmail:'Gmail', outlook_live:'Outlook Live', outlook_office:'Outlook 365', yahoo:'Yahoo Mail' };
const SEL_LABELS = {
  composeButton:'Compose Button', composeWindow:'Compose Window',
  toField:'To Field', subjectField:'Subject Field', bodyField:'Body Field',
};

function buildSelectorGrid() {
  const grid = $('selectorGrid');
  grid.innerHTML = '';
  ALL_PROVIDERS.forEach(pk => {
    const card = document.createElement('div');
    card.className = 'sel-card';
    card.innerHTML = `
      <div class="sel-card-head">
        <span class="sel-name">${PROVIDER_NAMES[pk]}</span>
        <span class="sel-dot" id="dot-${pk}"></span>
      </div>
      <div class="sel-card-body" id="sbody-${pk}">
        ${Object.entries(SEL_LABELS).map(([k,lbl]) => `
          <div class="sel-field-row">
            <span class="sel-field-name">${lbl}</span>
            <span class="sel-result" id="sr-${pk}-${k}">—</span>
          </div>`).join('')}
      </div>`;
    grid.appendChild(card);
  });
}
buildSelectorGrid();

$('testAllBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const ts = $('testerStatus'), ti = $('testerIcon'), tt = $('testerText');
  if (!tab) {
    ts.className = 'status-box error'; ti.textContent='❌'; tt.textContent='No active tab.'; ts.style.display='flex'; return;
  }
  ts.className='status-box running'; ti.textContent='⏳'; tt.textContent='Testing…'; ts.style.display='flex';
  $('testAllBtn').disabled = true;
  try {
    await chrome.scripting.executeScript({ target:{tabId:tab.id}, files:['selectors.js','content.js'] });
  } catch(_) {}
  try {
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const qf = s => { for (const p of s.split(',').map(x=>x.trim())) { try { if(document.querySelector(p)) return true; } catch(_){} } return false; };
        const out = {};
        for (const [pk, cfg] of Object.entries(MAIL_SELECTORS)) {
          out[pk] = {};
          ['composeButton','composeWindow','toField','subjectField','bodyField']
            .forEach(k => { out[pk][k] = cfg[k] ? qf(cfg[k]) : false; });
        }
        return out;
      }
    });
    const results = res.value;
    ALL_PROVIDERS.forEach(pk => {
      const pr = results[pk] || {};
      const allOk = Object.values(pr).every(Boolean);
      const dot = $(`dot-${pk}`);
      dot.className = `sel-dot ${allOk ? 'found' : Object.values(pr).some(Boolean) ? '' : 'missing'}`;
      Object.keys(SEL_LABELS).forEach(k => {
        const el = $(`sr-${pk}-${k}`);
        if (el) { el.className = `sel-result ${pr[k]?'ok':'err'}`; el.textContent = pr[k]?'✓ Found':'✗ Missing'; }
      });
    });
    ts.className='status-box success'; ti.textContent='✅';
    tt.textContent = `Tests done on ${new URL(tab.url).hostname}. Fix any ✗ Missing entries in selectors.js.`;
  } catch(err) {
    ts.className='status-box error'; ti.textContent='❌'; tt.textContent='Test failed: ' + err.message;
  }
  $('testAllBtn').disabled = false;
});

// ══════════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════════
restoreState();

// Show "Download Sample CSV" button when no file is loaded
$('downloadSampleBtnEmpty').style.display = 'block';

// Initialize email mode UI
setMode('email');
renderChips();
