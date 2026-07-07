/**
 * reports.js — Universal Mail Merger Analytics Dashboard
 *
 * Renders campaign history, stat cards, and Canvas charts.
 * All data sourced from chrome.storage.local via the background service worker.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);
const bg = (type, payload = {}) =>
  new Promise((res) => chrome.runtime.sendMessage({ type, ...payload }, res));

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
    " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function fmtDuration(ms) {
  if (!ms && ms !== 0) return "—";
  if (ms < 1000) return ms + "ms";
  if (ms < 60000) return (ms / 1000).toFixed(1) + "s";
  return Math.round(ms / 60000) + "m " + Math.round((ms % 60000) / 1000) + "s";
}

function fmtNum(n) {
  return (n || 0).toLocaleString();
}

function showToast(msg, duration = 2800) {
  const toast = $("toast");
  toast.textContent = msg;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), duration);
}

// ─── State ────────────────────────────────────────────────────────────────────
let allCampaigns   = [];
let filteredCampaigns = [];
let sortKey        = "createdAt";
let sortAsc        = false;
let expandedId     = null;

// ─── Load Data ────────────────────────────────────────────────────────────────
async function loadData() {
  const res = await bg("GET_CAMPAIGNS");
  allCampaigns = (res && res.campaigns) ? res.campaigns : [];
  renderAll();
}

function renderAll() {
  renderStats();
  renderCharts();
  applyFilters();
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────
function renderStats() {
  const c = allCampaigns;
  const totalCampaigns = c.length;
  const totalSuccess   = c.reduce((s, x) => s + (x.stats?.success || 0), 0);
  const totalFailed    = c.reduce((s, x) => s + (x.stats?.failed  || 0), 0);
  const totalAll       = totalSuccess + totalFailed;
  const rate           = totalAll > 0 ? Math.round((totalSuccess / totalAll) * 100) : 0;

  const durations = c.filter((x) => x.durationMs).map((x) => x.durationMs);
  const avgDur = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  const newest = c[0] ? fmtDate(c[0].createdAt) : "—";

  $("statCampaigns").textContent     = fmtNum(totalCampaigns);
  $("statCampaignSub").textContent   = totalCampaigns ? `Last: ${newest}` : "No campaigns yet";
  $("statSuccess").textContent       = fmtNum(totalSuccess);
  $("statSuccessSub").textContent    = `${fmtNum(c.reduce((s,x)=>s+(x.stats?.total||0),0))} total recipients`;
  $("statFailed").textContent        = fmtNum(totalFailed);
  $("statFailedSub").textContent     = totalFailed ? `${rate}% success rate` : "No failures";
  $("statRate").textContent          = rate + "%";
  $("statAvgTime").textContent       = fmtDuration(avgDur);
}

// ─── Canvas Charts ────────────────────────────────────────────────────────────

function drawDonut(canvas, segments, centerText) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 12, thick = 36;

  const total = segments.reduce((s, g) => s + g.value, 0);
  if (total === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#282840";
    ctx.lineWidth = thick;
    ctx.stroke();
    ctx.fillStyle = "#404060";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("No data", cx, cy);
    return;
  }

  let start = -Math.PI / 2;
  segments.forEach((seg) => {
    const sweep = (seg.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, start + sweep);
    ctx.strokeStyle = seg.color;
    ctx.lineWidth = thick;
    ctx.lineCap = "round";
    ctx.stroke();
    start += sweep;
  });

  // Center label
  ctx.fillStyle = "#e4e4f0";
  ctx.font = "bold 22px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(centerText, cx, cy - 8);
  ctx.fillStyle = "#6a6a92";
  ctx.font = "11px Inter, sans-serif";
  ctx.fillText("total", cx, cy + 12);
}

function drawBar(canvas, labels, datasets) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const padL = 36, padR = 12, padT = 12, padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxVal = Math.max(...datasets.flatMap((d) => d.values), 1);
  const barGroupW = chartW / labels.length;
  const barW = Math.max(4, barGroupW * 0.55 / datasets.length);

  // Grid lines
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const y = padT + (chartH / gridLines) * i;
    const val = Math.round(maxVal * (1 - i / gridLines));
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + chartW, y);
    ctx.strokeStyle = "#282840";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#404060";
    ctx.font = "9px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(val, padL - 4, y + 3);
  }

  // Bars
  datasets.forEach((ds, di) => {
    ds.values.forEach((val, i) => {
      const x = padL + i * barGroupW + di * (barW + 2) + (barGroupW - datasets.length * (barW + 2)) / 2;
      const barH = val > 0 ? Math.max(2, (val / maxVal) * chartH) : 0;
      const y = padT + chartH - barH;

      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, ds.color);
      grad.addColorStop(1, ds.colorEnd || ds.color + "88");

      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [2, 2, 0, 0]);
      ctx.fillStyle = grad;
      ctx.fill();
    });
  });

  // X labels
  labels.forEach((lbl, i) => {
    const x = padL + i * barGroupW + barGroupW / 2;
    ctx.fillStyle = "#4a4a6a";
    ctx.font = "9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(lbl, x, H - 6);
  });
}

function drawHBar(canvas, items) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  if (!items.length) {
    ctx.fillStyle = "#404060";
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("No data", W / 2, H / 2);
    return;
  }

  const padL = 110, padR = 50, padT = 14, gap = 10;
  const total = items.reduce((s, x) => s + x.value, 0);
  const rowH = (H - padT - gap * (items.length - 1)) / items.length;

  items.forEach((item, i) => {
    const y   = padT + i * (rowH + gap);
    const pct = total > 0 ? item.value / total : 0;
    const bW  = Math.max(4, pct * (W - padL - padR));

    // Label
    ctx.fillStyle = "#6a6a92";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(item.label, padL - 8, y + rowH / 2);

    // BG track
    ctx.beginPath();
    ctx.roundRect(padL, y + rowH * 0.2, W - padL - padR, rowH * 0.6, 3);
    ctx.fillStyle = "#1e1e30";
    ctx.fill();

    // Fill
    if (bW > 0) {
      const grad = ctx.createLinearGradient(padL, 0, padL + bW, 0);
      grad.addColorStop(0, item.color);
      grad.addColorStop(1, item.colorEnd || item.color);
      ctx.beginPath();
      ctx.roundRect(padL, y + rowH * 0.2, bW, rowH * 0.6, 3);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Value label
    ctx.fillStyle = "#e4e4f0";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(item.value, padL + bW + 6, y + rowH / 2);
  });
}

function renderCharts() {
  const c = allCampaigns;
  const totalS = c.reduce((s, x) => s + (x.stats?.success || 0), 0);
  const totalF = c.reduce((s, x) => s + (x.stats?.failed  || 0), 0);
  const total  = totalS + totalF;

  // Donut
  const donutCanvas = $("donutCanvas");
  drawDonut(donutCanvas,
    [
      { value: totalS, color: "#22c55e" },
      { value: totalF, color: "#f43f5e" },
    ],
    fmtNum(total)
  );
  const legend = $("donutLegend");
  legend.innerHTML = `
    <div class="donut-legend-item"><span class="donut-dot" style="background:#22c55e"></span>${fmtNum(totalS)} Success</div>
    <div class="donut-legend-item"><span class="donut-dot" style="background:#f43f5e"></span>${fmtNum(totalF)} Failed</div>
  `;

  // Bar — last 14 days
  const barCanvas = $("barCanvas");
  const days = 14;
  const dayLabels = [];
  const successVals = [];
  const failedVals = [];
  const now = new Date();
  for (let d = days - 1; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(now.getDate() - d);
    const key = day.toISOString().slice(0, 10);
    dayLabels.push(d === 0 ? "Today" : day.toLocaleDateString(undefined, { month: "numeric", day: "numeric" }));
    const dayC = c.filter((x) => x.createdAt && x.createdAt.slice(0, 10) === key);
    successVals.push(dayC.reduce((s, x) => s + (x.stats?.success || 0), 0));
    failedVals.push(dayC.reduce((s, x) => s + (x.stats?.failed  || 0), 0));
  }
  drawBar(barCanvas, dayLabels.filter((_, i) => i % 2 === 1 || i === days - 1 ? true : false).map(() => ""),
    [
      { values: successVals, color: "#22c55e", colorEnd: "#15803d" },
      { values: failedVals,  color: "#f43f5e", colorEnd: "#be123c" },
    ]
  );
  // Redraw with proper labels (every other)
  drawBar(barCanvas,
    dayLabels.map((l, i) => (i % 3 === 0 || i === days - 1) ? l : ""),
    [
      { values: successVals, color: "#22c55e", colorEnd: "#15803d" },
      { values: failedVals,  color: "#f43f5e", colorEnd: "#be123c" },
    ]
  );

  // Provider breakdown
  const provCanvas = $("provCanvas");
  const provMap = {};
  c.forEach((x) => {
    const p = x.provider || "Unknown";
    provMap[p] = (provMap[p] || 0) + (x.stats?.total || 0);
  });
  const PROV_COLORS = {
    "Gmail":                ["#f87171", "#ef4444"],
    "Outlook (Live)":       ["#60a5fa", "#3b82f6"],
    "Outlook (Office 365)": ["#818cf8", "#6366f1"],
    "Yahoo Mail":           ["#c084fc", "#a855f7"],
    "Unknown":              ["#6a6a92", "#4a4a6a"],
  };
  const provItems = Object.entries(provMap).map(([label, value]) => ({
    label, value,
    color:    (PROV_COLORS[label] || ["#7c5cfc", "#c084fc"])[0],
    colorEnd: (PROV_COLORS[label] || ["#7c5cfc", "#c084fc"])[1],
  })).sort((a, b) => b.value - a.value);
  drawHBar(provCanvas, provItems);
}

// ─── Filters & Sorting ────────────────────────────────────────────────────────
function applyFilters() {
  const search   = $("searchFilter").value.toLowerCase().trim();
  const status   = $("statusFilter").value;
  const provider = $("providerFilter").value;

  filteredCampaigns = allCampaigns.filter((c) => {
    if (search   && !c.name?.toLowerCase().includes(search) &&
                    !c.subject?.toLowerCase().includes(search)) return false;
    if (status   && c.status !== status) return false;
    if (provider && c.provider !== provider) return false;
    return true;
  });

  // Sort
  filteredCampaigns.sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey];
    if (sortKey === "total") { av = a.stats?.total || 0; bv = b.stats?.total || 0; }
    if (typeof av === "string") av = av.toLowerCase();
    if (typeof bv === "string") bv = bv.toLowerCase();
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });

  renderTable();
}

// Sort headers
document.querySelectorAll("thead th[data-sort]").forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    if (sortKey === key) sortAsc = !sortAsc;
    else { sortKey = key; sortAsc = false; }
    document.querySelectorAll("thead th").forEach((t) => t.classList.remove("sorted"));
    th.classList.add("sorted");
    th.querySelector(".sort-icon").textContent = sortAsc ? "↑" : "↓";
    applyFilters();
  });
});

[$("searchFilter"), $("statusFilter"), $("providerFilter")].forEach((el) =>
  el.addEventListener("input", applyFilters)
);

// ─── Table Render ─────────────────────────────────────────────────────────────
function renderTable() {
  const tbody = $("campaignTbody");
  const empty = $("emptyState");

  tbody.innerHTML = "";

  if (!filteredCampaigns.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  filteredCampaigns.forEach((c) => {
    const total   = c.stats?.total   || 0;
    const success = c.stats?.success || 0;
    const failed  = c.stats?.failed  || 0;
    const pct     = total > 0 ? Math.round((success / total) * 100) : 0;

    // Main row
    const tr = document.createElement("tr");
    tr.dataset.id = c.id;
    tr.innerHTML = `
      <td>
        <div style="font-weight:600;font-size:13px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(c.name || "Untitled")}">${escHtml(c.name || "Untitled")}</div>
        <div style="font-size:10.5px;color:var(--text-muted);margin-top:2px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(c.subject || "")}">${escHtml(c.subject || "")}</div>
      </td>
      <td><span class="provider-badge">${escHtml(c.provider || "—")}</span></td>
      <td style="font-size:11.5px;color:var(--text-muted);white-space:nowrap">${fmtDate(c.createdAt)}</td>
      <td><span class="pill ${c.status || "running"}">${statusEmoji(c.status)} ${c.status || "running"}</span></td>
      <td style="white-space:nowrap">
        <span style="font-weight:700">${success}</span>
        <span style="color:var(--text-dim)">/ ${total}</span>
        ${failed ? `<span style="color:var(--red);font-size:11px;margin-left:4px">(${failed} ✗)</span>` : ""}
      </td>
      <td>
        <div class="mini-bar-wrap">
          <div class="mini-bar"><div class="mini-bar-fill" style="width:${pct}%"></div></div>
          <span class="mini-pct">${pct}%</span>
        </div>
      </td>
      <td style="color:var(--text-muted);font-size:11.5px;white-space:nowrap">${fmtDuration(c.durationMs)}</td>
      <td style="text-align:right">
        <button class="nav-btn expand-btn" style="font-size:10.5px;padding:4px 9px" data-id="${c.id}">
          ${expandedId === c.id ? "▲ Hide" : "▼ Detail"}
        </button>
      </td>
    `;
    tbody.appendChild(tr);

    // Detail row
    const dtr = document.createElement("tr");
    dtr.className = "detail-row" + (expandedId === c.id ? " open" : "");
    dtr.dataset.detailId = c.id;
    const dtd = document.createElement("td");
    dtd.className = "detail-cell";
    dtd.colSpan = 8;
    dtd.innerHTML = renderDetailInner(c);
    dtr.appendChild(dtd);
    tbody.appendChild(dtr);
  });

  // Expand button listeners
  tbody.querySelectorAll(".expand-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      expandedId = expandedId === id ? null : id;
      renderTable();
    });
  });

  // Delete button listeners
  tbody.querySelectorAll(".delete-camp-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("Delete this campaign record?")) return;
      await bg("DELETE_CAMPAIGN", { campaignId: btn.dataset.id });
      showToast("Campaign deleted.");
      await loadData();
    });
  });
}

function renderDetailInner(c) {
  const recipients = c.recipients || [];
  if (!recipients.length) {
    return `<div class="detail-inner" style="color:var(--text-dim);font-size:12px">No recipient data recorded for this campaign.</div>`;
  }
  const rows = recipients.map((r) => `
    <tr>
      <td>${escHtml(r.email || "")}</td>
      <td><span class="pill ${r.status === "success" ? "success-r" : "failed-r"}">${r.status === "success" ? "✓ Success" : "✗ Failed"}</span></td>
      <td style="color:var(--text-muted)">${fmtDuration(r.durationMs)}</td>
      <td style="color:var(--text-muted);font-size:11px">${r.finishedAt ? fmtDate(r.finishedAt) : "—"}</td>
      <td class="err-msg">${escHtml(r.error || "")}</td>
    </tr>
  `).join("");

  return `
    <div class="detail-inner">
      <div class="detail-header">
        <span class="detail-title">📧 Recipient Results (${recipients.length})</span>
        <div style="display:flex;gap:8px">
          <button class="nav-btn" style="font-size:10.5px;padding:4px 9px" onclick="exportCampaign('${c.id}')">⬇ Export CSV</button>
          <button class="nav-btn danger delete-camp-btn" style="font-size:10.5px;padding:4px 9px" data-id="${c.id}">🗑 Delete</button>
        </div>
      </div>
      <div style="overflow-x:auto">
        <table class="recipient-table">
          <thead>
            <tr><th>Email</th><th>Status</th><th>Duration</th><th>Time</th><th>Error</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function statusEmoji(s) {
  return s === "completed" ? "✓" : s === "partial" ? "⚠" : s === "failed" ? "✗" : "⏳";
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function campaignsToCSV(campaigns) {
  const rows = [
    ["Campaign ID","Campaign Name","Provider","Date","Status","Mode","Subject",
     "Total","Success","Failed","Duration (ms)","Recipient Email","Recipient Status",
     "Recipient Duration (ms)","Recipient Error","Recipient Time"],
  ];
  campaigns.forEach((c) => {
    const recips = c.recipients || [];
    if (!recips.length) {
      rows.push([c.id, c.name || "", c.provider || "", c.createdAt || "", c.status || "",
        c.mode || "draft", c.subject || "", c.stats?.total || 0, c.stats?.success || 0,
        c.stats?.failed || 0, c.durationMs || 0, "", "", "", "", ""]);
    } else {
      recips.forEach((r) => {
        rows.push([c.id, c.name || "", c.provider || "", c.createdAt || "", c.status || "",
          c.mode || "draft", c.subject || "", c.stats?.total || 0, c.stats?.success || 0,
          c.stats?.failed || 0, c.durationMs || 0,
          r.email || "", r.status || "", r.durationMs || 0, r.error || "", r.finishedAt || ""]);
      });
    }
  });
  return rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

$("exportAllBtn").addEventListener("click", () => {
  if (!allCampaigns.length) { showToast("No campaigns to export."); return; }
  downloadCSV(campaignsToCSV(allCampaigns), `mail-merger-all-${Date.now()}.csv`);
  showToast("✓ All campaigns exported!");
});

$("exportFilteredBtn").addEventListener("click", () => {
  if (!filteredCampaigns.length) { showToast("No campaigns match current filters."); return; }
  downloadCSV(campaignsToCSV(filteredCampaigns), `mail-merger-filtered-${Date.now()}.csv`);
  showToast(`✓ ${filteredCampaigns.length} campaign(s) exported!`);
});

window.exportCampaign = (id) => {
  const c = allCampaigns.find((x) => x.id === id);
  if (!c) return;
  downloadCSV(campaignsToCSV([c]), `campaign-${c.name?.replace(/\s+/g, "_") || id}-${Date.now()}.csv`);
  showToast("✓ Campaign exported!");
};

// ─── Clear All ────────────────────────────────────────────────────────────────
$("clearAllBtn").addEventListener("click", async () => {
  if (!allCampaigns.length) { showToast("Nothing to clear."); return; }
  const ok = confirm(
    `Delete ALL ${allCampaigns.length} campaign records?\n\nThis cannot be undone.`
  );
  if (!ok) return;
  await bg("CLEAR_CAMPAIGNS");
  showToast("🗑 All campaign history cleared.");
  await loadData();
});

// ─── Auto-refresh (for running campaigns) ────────────────────────────────────
let refreshInterval = null;

function startAutoRefresh() {
  if (refreshInterval) return;
  refreshInterval = setInterval(async () => {
    const hasRunning = allCampaigns.some((c) => c.status === "running");
    if (hasRunning) await loadData();
    else { clearInterval(refreshInterval); refreshInterval = null; }
  }, 3000);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
loadData().then(() => {
  if (allCampaigns.some((c) => c.status === "running")) startAutoRefresh();
});

// Listen for live updates from the background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "MERGE_STATUS" && msg.done) {
    loadData();
  }
});
