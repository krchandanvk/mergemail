/**
 * popup.js v3 — Universal Mail Merger Popup Controller
 *
 * NEW in v3:
 *  - Campaign naming (auto-generated or user-defined)
 *  - Campaign creation/update via background.js messages
 *  - Campaigns tab: quick stats + recent history list
 *  - Reports tab opener (chrome.tabs.create via background)
 *  - Full Selector Tester
 *  - All v2 features: tabs, templates, CSV, storage persistence, Send All, preview
 */

// ─── Utility: background messaging ──────────────────────────────────────────
const bg = (type, payload = {}) =>
  new Promise((res) => chrome.runtime.sendMessage({ type, ...payload }, res));

// ─── Tab Navigation ──────────────────────────────────────────────────────────
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "campaigns") loadCampaignHistory();
  });
});

// ─── DOM References ──────────────────────────────────────────────────────────
const campaignNameInput  = document.getElementById("campaignName");
const recipientsTextarea = document.getElementById("recipients");
const subjectInput       = document.getElementById("subject");
const bodyTextarea       = document.getElementById("body");
const startBtn           = document.getElementById("startBtn");
const statusBox          = document.getElementById("statusBox");
const statusIcon         = document.getElementById("statusIcon");
const statusText         = document.getElementById("statusText");
const progressBar        = document.getElementById("progressBar");
const progressFill       = document.getElementById("progressFill");
const charCount          = document.getElementById("charCount");
const recipientBadge     = document.getElementById("recipientBadge");
const sendAllToggle      = document.getElementById("sendAllToggle");
const previewBtn         = document.getElementById("previewBtn");
const previewPanel       = document.getElementById("previewPanel");
const previewTo          = document.getElementById("previewTo");
const previewSubject     = document.getElementById("previewSubject");
const previewBodyEl      = document.getElementById("previewBody");
const previewIndex       = document.getElementById("previewIndex");
const openReportsBtn     = document.getElementById("openReportsBtn");

// ─── State ───────────────────────────────────────────────────────────────────
let csvRows    = [];
let mergedRows = [];
let previewIdx = 0;
let activeCampaignId = null;
let mergeStartTime   = null;

// ─── Campaign Name Auto-fill ──────────────────────────────────────────────────
function generateCampaignName() {
  const now = new Date();
  return `Campaign — ${now.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

// ─── Persistence ─────────────────────────────────────────────────────────────
const STORAGE_KEYS = ["recipients", "subject", "body", "sendAll", "campaignName"];

function saveState() {
  chrome.storage.local.set({
    recipients:   recipientsTextarea.value,
    subject:      subjectInput.value,
    body:         bodyTextarea.value,
    sendAll:      sendAllToggle.checked,
    campaignName: campaignNameInput.value,
  });
}

async function loadState() {
  const data = await chrome.storage.local.get(STORAGE_KEYS);
  if (data.recipients)   recipientsTextarea.value = data.recipients;
  if (data.subject)      subjectInput.value        = data.subject;
  if (data.body)         bodyTextarea.value         = data.body;
  if (data.sendAll)      sendAllToggle.checked      = data.sendAll;
  campaignNameInput.value = data.campaignName || generateCampaignName();
  updateRecipientBadge();
  charCount.textContent = bodyTextarea.value.length + " chars";
}
loadState();

[recipientsTextarea, subjectInput, bodyTextarea, sendAllToggle, campaignNameInput].forEach((el) => {
  el.addEventListener("input", saveState);
  el.addEventListener("change", saveState);
});

// ─── Template Engine ──────────────────────────────────────────────────────────
function resolveTemplate(template, row) {
  return template.replace(/\{\{(\w+)\}\}/g, (m, k) => k in row ? row[k] : m);
}

function buildMergedRows() {
  const rawEmails = parseRecipients(recipientsTextarea.value);
  mergedRows = csvRows.length > 0
    ? csvRows.map((r) => ({ ...r }))
    : rawEmails.map((email) => ({ email }));
  return mergedRows;
}

// ─── Merge Chips ─────────────────────────────────────────────────────────────
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const tag    = `{{${chip.dataset.var}}}`;
    const active = document.activeElement;
    const target = [bodyTextarea, subjectInput].includes(active) ? active : bodyTextarea;
    const s = target.selectionStart, e = target.selectionEnd;
    target.value = target.value.slice(0, s) + tag + target.value.slice(e);
    target.selectionStart = target.selectionEnd = s + tag.length;
    target.focus();
    saveState();
  });
});

// ─── Recipient Badge ─────────────────────────────────────────────────────────
function updateRecipientBadge() {
  const count = csvRows.length > 0
    ? csvRows.length
    : parseRecipients(recipientsTextarea.value).length;
  if (count > 0) {
    recipientBadge.textContent = `${count} recipient${count !== 1 ? "s" : ""}`;
    recipientBadge.style.display = "inline-flex";
  } else {
    recipientBadge.style.display = "none";
  }
  buildMergedRows();
  refreshPreview();
}
recipientsTextarea.addEventListener("input", updateRecipientBadge);

// ─── Preview ─────────────────────────────────────────────────────────────────
function highlightVars(str) {
  return str.replace(/\{\{(\w+)\}\}/g, '<span class="highlight">{{$1}}</span>');
}
function refreshPreview() {
  if (!previewPanel.classList.contains("visible")) return;
  const rows = mergedRows.length ? mergedRows : [{ email: "(no recipients)" }];
  const row  = rows[Math.min(previewIdx, rows.length - 1)];
  previewIdx = Math.min(previewIdx, rows.length - 1);
  previewTo.innerHTML       = highlightVars(row.email || "");
  previewSubject.innerHTML  = highlightVars(resolveTemplate(subjectInput.value, row));
  previewBodyEl.innerHTML   = highlightVars(resolveTemplate(bodyTextarea.value, row));
  previewIndex.textContent  = `${previewIdx + 1} / ${rows.length}`;
}

previewBtn.addEventListener("click", () => {
  previewPanel.classList.toggle("visible");
  if (previewPanel.classList.contains("visible")) {
    buildMergedRows(); previewIdx = 0; refreshPreview();
    previewBtn.textContent = "✕ Close Preview";
  } else {
    previewBtn.textContent = "👁 Preview";
  }
});
document.getElementById("prevPreview").addEventListener("click", () => { if (previewIdx > 0) { previewIdx--; refreshPreview(); } });
document.getElementById("nextPreview").addEventListener("click", () => { if (previewIdx < mergedRows.length - 1) { previewIdx++; refreshPreview(); } });
[subjectInput, bodyTextarea].forEach((el) => el.addEventListener("input", refreshPreview));

// ─── Char counter ─────────────────────────────────────────────────────────────
bodyTextarea.addEventListener("input", () => { charCount.textContent = bodyTextarea.value.length + " chars"; });

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseRecipients(raw) {
  return raw.split(/[\n,]+/).map((e) => e.trim()).filter(Boolean);
}
function setStatus(type, message) {
  statusBox.className = "status-box " + type;
  statusIcon.textContent =
    type === "running" ? "⏳" : type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
  statusText.textContent = message;
  statusBox.style.display = "flex";
}
function updateProgress(current, total) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  progressBar.style.display = "block";
  progressFill.style.width = pct + "%";
  progressFill.setAttribute("aria-valuenow", pct);
}
function resetProgress() {
  progressBar.style.display = "none";
  progressFill.style.width = "0%";
}
function lockUI(locked) {
  [startBtn, recipientsTextarea, subjectInput, bodyTextarea, sendAllToggle].forEach((el) => el.disabled = locked);
  startBtn.textContent = locked ? "⏳ Running…" : "🚀 Start Mail Merge";
}

// ─── Send All Warning ─────────────────────────────────────────────────────────
sendAllToggle.addEventListener("change", () => {
  if (sendAllToggle.checked) {
    const ok = confirm("⚠️ SEND ALL MODE\n\nThis will SEND every email automatically — not just create drafts.\n\nCannot be undone. Continue?");
    if (!ok) sendAllToggle.checked = false;
  }
  saveState();
});

// ─── Reports Button ───────────────────────────────────────────────────────────
openReportsBtn.addEventListener("click", () => bg("OPEN_REPORTS"));

// ─── Start Merge ──────────────────────────────────────────────────────────────
startBtn.addEventListener("click", async () => {
  const subject  = subjectInput.value.trim();
  const body     = bodyTextarea.value.trim();
  const autoSend = sendAllToggle.checked;

  buildMergedRows();

  if (!recipientsTextarea.value.trim() && csvRows.length === 0) {
    setStatus("error", "Please enter at least one recipient or import a CSV file."); return;
  }
  if (!subject) { setStatus("error", "Subject cannot be empty."); return; }
  if (!body)    { setStatus("error", "Message body cannot be empty."); return; }
  if (!mergedRows.length) { setStatus("error", "No valid recipients found."); return; }

  if (mergedRows.length > 10) {
    const verb = autoSend ? "send" : "draft";
    if (!confirm(`You are about to ${verb} ${mergedRows.length} emails. Continue?`)) return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) { setStatus("error", "Cannot detect active tab."); return; }

  const SUPPORTED = ["mail.google.com","outlook.live.com","outlook.office365.com","mail.yahoo.com"];
  const tabHost   = new URL(tab.url).hostname;
  if (!SUPPORTED.some((h) => tabHost === h || tabHost.endsWith("." + h))) {
    setStatus("error", "Please open Gmail, Outlook, or Yahoo Mail in your active tab."); return;
  }

  // Detect provider name from hostname
  const providerMap = {
    "mail.google.com":          "Gmail",
    "outlook.live.com":         "Outlook (Live)",
    "outlook.office365.com":    "Outlook (Office 365)",
    "mail.yahoo.com":           "Yahoo Mail",
  };
  const provider = providerMap[tabHost] ||
    Object.entries(providerMap).find(([h]) => tabHost.endsWith("." + h))?.[1] || "Unknown";

  // Inject scripts (idempotent)
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["selectors.js","content.js"] });
  } catch (_) {}

  // Create campaign record
  const campName = campaignNameInput.value.trim() || generateCampaignName();
  const campRes  = await bg("SAVE_CAMPAIGN", {
    campaign: {
      name:       campName,
      provider,
      mode:       autoSend ? "send" : "draft",
      subject,
      body,
      totalCount: mergedRows.length,
    }
  });
  activeCampaignId = campRes?.id || null;
  mergeStartTime   = Date.now();

  lockUI(true);
  resetProgress();
  setStatus("running", `Starting "${campName}" — ${mergedRows.length} recipient(s)…`);

  // Resolve templates
  const resolved = mergedRows.map((row) => ({
    email:   row.email || "",
    subject: resolveTemplate(subject, row),
    body:    resolveTemplate(body, row),
  }));

  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: "START_MERGE",
      resolved,
      autoSend,
      campaignId: activeCampaignId,
    });
  } catch (err) {
    lockUI(false);
    setStatus("error", "Could not communicate with the page. Try refreshing the webmail tab.");
    if (activeCampaignId) bg("FINALIZE_CAMPAIGN", { campaignId: activeCampaignId, status: "failed", durationMs: 0 });
  }
});

// ─── Status Listener ─────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "MERGE_STATUS") return;

  if (message.error) {
    lockUI(false); resetProgress();
    setStatus("error", message.error);
    return;
  }
  if (message.done && message.success) {
    lockUI(false);
    updateProgress(message.total, message.total);
    const mode = sendAllToggle.checked ? "sent" : "draft(s) created";
    setStatus("success", `✓ All ${message.total} emails ${mode}! Review before sending.`);
    // Refresh the campaign name for next run
    campaignNameInput.value = generateCampaignName();
    saveState();
    return;
  }
  updateProgress(message.current, message.total);
  setStatus("running", `Drafting ${message.current} of ${message.total}: ${message.recipient}`);
});

// ═══════════════════════════ CSV IMPORT ═══════════════════════════════════════

const csvDropZone  = document.getElementById("csvDropZone");
const csvFileInput = document.getElementById("csvFileInput");
const csvTableWrap = document.getElementById("csvTableWrap");
const csvThead     = document.getElementById("csvThead");
const csvTbody     = document.getElementById("csvTbody");
const csvInfo      = document.getElementById("csvInfo");
const csvClearBtn  = document.getElementById("csvClearBtn");
const applyCSVBtn  = document.getElementById("applyCSVBtn");
const mapEmail     = document.getElementById("mapEmail");
const mapName      = document.getElementById("mapName");
const mapCompany   = document.getElementById("mapCompany");
const mapRole      = document.getElementById("mapRole");

let csvHeaders = [], csvRawData = [];

csvDropZone.addEventListener("click",  () => csvFileInput.click());
csvDropZone.addEventListener("keydown",(e) => { if (e.key==="Enter"||e.key===" ") csvFileInput.click(); });
csvDropZone.addEventListener("dragover",(e) => { e.preventDefault(); csvDropZone.classList.add("drag-over"); });
csvDropZone.addEventListener("dragleave", () => csvDropZone.classList.remove("drag-over"));
csvDropZone.addEventListener("drop",(e) => { e.preventDefault(); csvDropZone.classList.remove("drag-over"); const f=e.dataTransfer.files[0]; if(f) processCSVFile(f); });
csvFileInput.addEventListener("change", () => { if(csvFileInput.files[0]) processCSVFile(csvFileInput.files[0]); });

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const cells = []; let cur = "", inQ = false;
    for (const ch of line) {
      if (ch==='"') inQ=!inQ;
      else if (ch==="," && !inQ) { cells.push(cur.trim()); cur=""; }
      else cur += ch;
    }
    cells.push(cur.trim());
    const obj = {};
    headers.forEach((h,i)=>{ obj[h]=(cells[i]||"").replace(/^"|"$/g,""); });
    return obj;
  }).filter((r) => Object.values(r).some(Boolean));
  return { headers, rows };
}

function processCSVFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const { headers, rows } = parseCSV(e.target.result);
    if (!headers.length) { alert("Could not parse CSV. Ensure it has a header row."); return; }
    csvHeaders = headers; csvRawData = rows;
    renderCSVTable(); populateColumnMaps();
  };
  reader.readAsText(file,"UTF-8");
}

function renderCSVTable() {
  const PREV = 5;
  csvThead.innerHTML = `<tr>${csvHeaders.map((h)=>`<th>${h}</th>`).join("")}</tr>`;
  csvTbody.innerHTML = csvRawData.slice(0,PREV).map((r)=>
    `<tr>${csvHeaders.map((h)=>`<td title="${r[h]||""}">${r[h]||""}</td>`).join("")}</tr>`
  ).join("");
  csvInfo.textContent = `${csvRawData.length} rows · ${csvHeaders.length} columns${csvRawData.length>PREV?` (showing first ${PREV})`:""}`;
  csvTableWrap.classList.add("visible");
}

function populateColumnMaps() {
  [mapEmail,mapName,mapCompany,mapRole].forEach((sel)=>{
    sel.innerHTML = `<option value="">— ${sel===mapEmail?"select":"none"} —</option>`;
    csvHeaders.forEach((h)=>{ const o=document.createElement("option"); o.value=o.textContent=h; sel.appendChild(o); });
    const lo = csvHeaders.map((h)=>h.toLowerCase());
    if (sel===mapEmail)   sel.value=csvHeaders[lo.findIndex((h)=>h.includes("email")||h==="e-mail")]||"";
    if (sel===mapName)    sel.value=csvHeaders[lo.findIndex((h)=>h.includes("name")&&!h.includes("company")&&!h.includes("last"))]||"";
    if (sel===mapCompany) sel.value=csvHeaders[lo.findIndex((h)=>h.includes("company")||h.includes("org"))]||"";
    if (sel===mapRole)    sel.value=csvHeaders[lo.findIndex((h)=>h.includes("role")||h.includes("title")||h.includes("position"))]||"";
  });
}

csvClearBtn.addEventListener("click",()=>{
  csvHeaders=[]; csvRawData=[]; csvRows=[]; mergedRows=[];
  csvTableWrap.classList.remove("visible");
  csvThead.innerHTML=csvTbody.innerHTML=""; csvFileInput.value="";
  recipientsTextarea.value=""; updateRecipientBadge(); saveState();
});

applyCSVBtn.addEventListener("click",()=>{
  const ec=mapEmail.value, nc=mapName.value, cc=mapCompany.value, rc=mapRole.value;
  if (!ec) { alert("Please select which CSV column contains email addresses."); return; }
  csvRows = csvRawData.map((row)=>({
    email:   row[ec]||"",
    name:    nc?(row[nc]||""):"",
    company: cc?(row[cc]||""):"",
    role:    rc?(row[rc]||""):"",
    ...row,
  })).filter((r)=>r.email);
  recipientsTextarea.value = csvRows.map((r)=>r.email).join("\n");
  saveState(); updateRecipientBadge();
  document.querySelector('[data-tab="compose"]').click();
  setStatus("idle",`✓ Loaded ${csvRows.length} recipient(s) from CSV.`);
  statusBox.style.display="flex";
});

// ═══════════════════════════ CAMPAIGN HISTORY TAB ═════════════════════════════

async function loadCampaignHistory() {
  const res       = await bg("GET_CAMPAIGNS");
  const campaigns = res?.campaigns || [];
  const total     = campaigns.length;
  const totalS    = campaigns.reduce((s,c)=>s+(c.stats?.success||0),0);
  const totalAll  = campaigns.reduce((s,c)=>s+(c.stats?.total||0),0);
  const rate      = totalAll>0 ? Math.round((totalS/totalAll)*100) : 0;

  document.getElementById("qTotalCampaigns").textContent = total || "0";
  document.getElementById("qTotalSuccess").textContent   = totalS || "0";
  document.getElementById("qSuccessRate").textContent    = totalAll ? rate + "%" : "—";

  const list = document.getElementById("campHistoryList");
  if (!campaigns.length) {
    list.innerHTML = `<div class="camp-empty">No campaigns yet. Run a merge to see history here.</div>`;
    return;
  }

  list.innerHTML = campaigns.slice(0, 8).map((c) => {
    const total   = c.stats?.total   || 0;
    const success = c.stats?.success || 0;
    const pct     = total > 0 ? Math.round((success/total)*100) : 0;
    const date    = c.createdAt ? new Date(c.createdAt).toLocaleDateString(undefined,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "";
    return `
      <div class="camp-card">
        <div class="camp-card-top">
          <div class="camp-card-name" title="${escHtml(c.name||"Untitled")}">${escHtml(c.name||"Untitled")}</div>
          <span class="camp-pill ${c.status||"running"}">${statusEmoji(c.status)} ${c.status||"running"}</span>
        </div>
        <div class="camp-card-meta">
          <span>${escHtml(c.provider||"—")}</span>
          <span>·</span>
          <span>${success}/${total} drafted</span>
          <span>·</span>
          <div class="camp-mini-bar"><div class="camp-mini-fill" style="width:${pct}%"></div></div>
          <span>${pct}%</span>
          <span style="margin-left:auto">${date}</span>
        </div>
      </div>`;
  }).join("");
}

function statusEmoji(s) {
  return s==="completed"?"✓":s==="partial"?"⚠":s==="failed"?"✗":"⏳";
}
function escHtml(str) {
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ═══════════════════════════ SELECTOR TESTER ═══════════════════════════════════

const selectorGrid = document.getElementById("selectorGrid");
const testAllBtn   = document.getElementById("testAllBtn");
const testerStatus = document.getElementById("testerStatus");
const testerIcon   = document.getElementById("testerIcon");
const testerText   = document.getElementById("testerText");

const SELECTOR_LABELS = {
  composeButton:"Compose Button", composeWindow:"Compose Window",
  toField:"To Field", subjectField:"Subject Field", bodyField:"Body Field",
};
const ALL_PROVIDERS   = ["gmail","outlook_live","outlook_office","yahoo"];
const PROVIDER_NAMES  = { gmail:"Gmail", outlook_live:"Outlook Live", outlook_office:"Outlook 365", yahoo:"Yahoo Mail" };

function buildSelectorGrid() {
  selectorGrid.innerHTML = "";
  ALL_PROVIDERS.forEach((provKey) => {
    const card = document.createElement("div");
    card.className = "selector-item";
    card.innerHTML = `
      <div class="selector-item-head">
        <span class="selector-name">${PROVIDER_NAMES[provKey]}</span>
        <span class="selector-status-dot" id="dot-${provKey}"></span>
      </div>
      <div class="selector-item-body" id="body-${provKey}">
        ${Object.entries(SELECTOR_LABELS).map(([k,label])=>`
          <div class="selector-field">
            <div class="selector-field-label">${label}</div>
            <div class="selector-field-result" id="result-${provKey}-${k}">—</div>
          </div>`).join("")}
      </div>`;
    selectorGrid.appendChild(card);
  });
}
buildSelectorGrid();

testAllBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    testerStatus.className = "status-box error"; testerIcon.textContent="❌";
    testerText.textContent = "No active tab found."; testerStatus.style.display="flex"; return;
  }
  testerStatus.className="status-box running"; testerIcon.textContent="⏳";
  testerText.textContent="Testing selectors…"; testerStatus.style.display="flex";
  testAllBtn.disabled=true;
  try {
    await chrome.scripting.executeScript({ target:{tabId:tab.id}, files:["selectors.js","content.js"] });
  } catch(_) {}
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        function qFirst(sel){const ps=sel.split(",").map(s=>s.trim());for(const s of ps){try{const el=document.querySelector(s);if(el)return true;}catch(_){}}return false;}
        const out={};
        for(const[pk,cfg] of Object.entries(MAIL_SELECTORS)){
          out[pk]={};
          ["composeButton","composeWindow","toField","subjectField","bodyField"].forEach(k=>{out[pk][k]=cfg[k]?qFirst(cfg[k]):false;});
        }
        return out;
      }
    });
    const results = result.value;
    ALL_PROVIDERS.forEach((pk)=>{
      const pr=results[pk]||{};
      const allOk=Object.values(pr).every(Boolean);
      const anyOk=Object.values(pr).some(Boolean);
      const dot=document.getElementById(`dot-${pk}`);
      dot.className=`selector-status-dot ${allOk?"found":anyOk?"":"missing"}`;
      Object.keys(SELECTOR_LABELS).forEach(k=>{
        const el=document.getElementById(`result-${pk}-${k}`);
        if(el){el.className=`selector-field-result ${pr[k]?"ok":"err"}`;el.textContent=pr[k]?"✓ Found":"✗ Not found";}
      });
    });
    const host=new URL(tab.url).hostname;
    testerStatus.className="status-box success"; testerIcon.textContent="✅";
    testerText.textContent=`Tests complete on ${host}. ✗ entries need updating in selectors.js.`;
  } catch(err){
    testerStatus.className="status-box error"; testerIcon.textContent="❌";
    testerText.textContent="Test failed: "+err.message;
  }
  testAllBtn.disabled=false;
});
