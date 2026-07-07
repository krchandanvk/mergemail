import React from 'react';

export default function CampaignsPage() {
  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">📋 Outreach Campaigns</h2>
          <p className="text-sm text-zinc-400">
            Monitor and manage active, scheduled, and completed personalized email sequences.
          </p>
        </div>
        <a href="/compose" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-all shadow-lg shadow-indigo-600/20">
          🚀 New Campaign
        </a>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-zinc-800 pb-4">
        <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 text-white">All (3)</button>
        <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:bg-zinc-900/50 hover:text-white transition-all">🏃 Running (1)</button>
        <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:bg-zinc-900/50 hover:text-white transition-all">📅 Scheduled (1)</button>
        <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:bg-zinc-900/50 hover:text-white transition-all">✍️ Draft (1)</button>
      </div>

      {/* Campaigns list table */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/30 text-xs font-bold text-zinc-500">
              <th className="p-4">Campaign Details</th>
              <th className="p-4">Status</th>
              <th className="p-4">Delivery Progress</th>
              <th className="p-4">Delivered</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            <tr className="border-b border-zinc-800/60 hover:bg-zinc-800/10 transition-all">
              <td className="p-4">
                <div className="font-bold text-white">Q3 Software Engineer Outreach</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">SMTP Rotation · 3s interval</div>
              </td>
              <td className="p-4">
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Running</span>
              </td>
              <td className="p-4">
                <div className="flex flex-col gap-1.5 max-w-[140px]">
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>124 / 450 sent</span>
                    <span>28%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '28%' }}></div>
                  </div>
                </div>
              </td>
              <td className="p-4 font-semibold text-zinc-300">98%</td>
              <td className="p-4 text-right">
                <button className="px-2 py-1 rounded border border-zinc-800 bg-zinc-900 text-[10px] text-zinc-300 hover:bg-zinc-800">Pause</button>
              </td>
            </tr>

            <tr className="border-b border-zinc-800/60 hover:bg-zinc-800/10 transition-all">
              <td className="p-4">
                <div className="font-bold text-white">Direct Sourcing – Product Managers</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Manual sending · No interval</div>
              </td>
              <td className="p-4">
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700/50">Draft</span>
              </td>
              <td className="p-4">—</td>
              <td className="p-4">—</td>
              <td className="p-4 text-right">
                <button className="px-2 py-1 rounded border border-zinc-800 bg-zinc-900 text-[10px] text-zinc-300 hover:bg-zinc-800">Edit</button>
              </td>
            </tr>

            <tr className="hover:bg-zinc-800/10 transition-all">
              <td className="p-4">
                <div className="font-bold text-white">Candidate Warmups (August)</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">SMTP Rotation · 5s interval</div>
              </td>
              <td className="p-4">
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Scheduled</span>
              </td>
              <td className="p-4">—</td>
              <td className="p-4">—</td>
              <td className="p-4 text-right">
                <button className="px-2 py-1 rounded border border-zinc-800 bg-zinc-900 text-[10px] text-zinc-300 hover:bg-zinc-800">Cancel</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
