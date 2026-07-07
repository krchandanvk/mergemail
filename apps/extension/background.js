/**
 * background.js — Universal Mail Merger Service Worker
 *
 * Acts as the single data broker for all campaign persistence.
 * All reads/writes to chrome.storage.local for campaigns go through here
 * to prevent race conditions between popup and content script contexts.
 *
 * Message API:
 *   SAVE_CAMPAIGN    { campaign }           → { id }
 *   UPDATE_RECIPIENT { campaignId, result } → { ok }
 *   FINALIZE_CAMPAIGN{ campaignId, status } → { ok }
 *   GET_CAMPAIGNS    {}                     → { campaigns }
 *   DELETE_CAMPAIGN  { campaignId }         → { ok }
 *   CLEAR_CAMPAIGNS  {}                     → { ok }
 *   OPEN_REPORTS     {}                     → (opens reports tab)
 */

const STORAGE_KEY = "ummCampaigns";
const MAX_CAMPAIGNS = 200; // rolling window

// ─── Storage Helpers ──────────────────────────────────────────────────────────

async function readCampaigns() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data[STORAGE_KEY] || [];
}

async function writeCampaigns(campaigns) {
  await chrome.storage.local.set({ [STORAGE_KEY]: campaigns });
}

// ─── UUID ─────────────────────────────────────────────────────────────────────

function generateId() {
  return "c-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

// ─── Message Handler ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {

        // ── Create a new campaign ────────────────────────────────────────────
        case "SAVE_CAMPAIGN": {
          const campaigns = await readCampaigns();
          const campaign  = {
            ...message.campaign,
            id:        generateId(),
            createdAt: new Date().toISOString(),
            status:    "running",
            recipients: [],
            stats: { total: message.campaign.totalCount || 0, success: 0, failed: 0, skipped: 0 },
          };
          campaigns.unshift(campaign);
          // Rolling window — trim old campaigns
          if (campaigns.length > MAX_CAMPAIGNS) campaigns.splice(MAX_CAMPAIGNS);
          await writeCampaigns(campaigns);
          sendResponse({ id: campaign.id });
          break;
        }

        // ── Append a single recipient result to a campaign ───────────────────
        case "UPDATE_RECIPIENT": {
          const campaigns = await readCampaigns();
          const idx = campaigns.findIndex((c) => c.id === message.campaignId);
          if (idx === -1) { sendResponse({ ok: false, error: "Campaign not found" }); break; }

          const campaign = campaigns[idx];
          const result   = message.result; // RecipientResult

          campaign.recipients.push(result);

          // Update running stats
          if (result.status === "success") campaign.stats.success++;
          else if (result.status === "failed") campaign.stats.failed++;
          else campaign.stats.skipped++;

          campaigns[idx] = campaign;
          await writeCampaigns(campaigns);
          sendResponse({ ok: true });
          break;
        }

        // ── Mark campaign complete / failed / partial ────────────────────────
        case "FINALIZE_CAMPAIGN": {
          const campaigns = await readCampaigns();
          const idx = campaigns.findIndex((c) => c.id === message.campaignId);
          if (idx === -1) { sendResponse({ ok: false }); break; }

          const campaign  = campaigns[idx];
          campaign.status     = message.status; // "completed" | "partial" | "failed"
          campaign.finishedAt = new Date().toISOString();
          campaign.durationMs = message.durationMs || 0;
          campaigns[idx] = campaign;
          await writeCampaigns(campaigns);
          sendResponse({ ok: true });
          break;
        }

        // ── Fetch all campaigns ──────────────────────────────────────────────
        case "GET_CAMPAIGNS": {
          const campaigns = await readCampaigns();
          sendResponse({ campaigns });
          break;
        }

        // ── Delete one campaign ──────────────────────────────────────────────
        case "DELETE_CAMPAIGN": {
          let campaigns = await readCampaigns();
          campaigns = campaigns.filter((c) => c.id !== message.campaignId);
          await writeCampaigns(campaigns);
          sendResponse({ ok: true });
          break;
        }

        // ── Clear all campaign history ───────────────────────────────────────
        case "CLEAR_CAMPAIGNS": {
          await writeCampaigns([]);
          sendResponse({ ok: true });
          break;
        }

        // ── Open the Reports page in a new tab ──────────────────────────────
        case "OPEN_REPORTS": {
          const url = chrome.runtime.getURL("reports.html");
          const tabs = await chrome.tabs.query({ url });
          if (tabs.length > 0) {
            // Focus existing reports tab
            await chrome.tabs.update(tabs[0].id, { active: true });
            await chrome.windows.update(tabs[0].windowId, { focused: true });
          } else {
            await chrome.tabs.create({ url });
          }
          sendResponse({ ok: true });
          break;
        }

        default:
          sendResponse({ error: "Unknown message type: " + message.type });
      }
    } catch (err) {
      console.error("[MailMerger BG]", err);
      sendResponse({ error: err.message });
    }
  })();

  return true; // keep channel open for async response
});

// ─── Install / Update ─────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("[MailMerger] Installed v3.0.0 — Campaign tracking active.");
  } else if (details.reason === "update") {
    console.log(`[MailMerger] Updated to v3.0.0 from ${details.previousVersion}.`);
  }
});
