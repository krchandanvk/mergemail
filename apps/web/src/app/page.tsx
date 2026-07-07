import React from 'react';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      
      {/* Hero Welcome banner */}
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-black p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <h2 className="text-xl font-bold mb-2">Welcome back, Recruiter Workspace!</h2>
        <p className="text-sm text-zinc-400 max-w-xl">
          Scale your email personalization with true one-to-one template resolution. Rotate across multiple senders to protect your sender domain score.
        </p>
        <div className="flex gap-3 mt-4">
          <a href="/compose" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-all shadow-lg shadow-indigo-600/20">
            🚀 Create Campaign
          </a>
          <a href="/settings" className="px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition-all">
            🔧 Connect Sender
          </a>
        </div>
      </div>

      {/* Stats Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-zinc-800 bg-zinc-900/40 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Emails Sent (Today)</div>
          <div className="text-3xl font-extrabold text-white">418</div>
          <div className="text-[10px] text-emerald-500 mt-2 font-medium">✓ 99.2% Delivery Rate</div>
        </div>
        <div className="border border-zinc-800 bg-zinc-900/40 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Open Rate (Avg)</div>
          <div className="text-3xl font-extrabold text-white">68.4%</div>
          <div className="text-[10px] text-emerald-500 mt-2 font-medium">▲ +4.2% since last week</div>
        </div>
        <div className="border border-zinc-800 bg-zinc-900/40 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Active Campaigns</div>
          <div className="text-3xl font-extrabold text-white">3</div>
          <div className="text-[10px] text-zinc-400 mt-2 font-medium">Running background workers</div>
        </div>
        <div className="border border-zinc-800 bg-zinc-900/40 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Connected Senders</div>
          <div className="text-3xl font-extrabold text-white">8</div>
          <div className="text-[10px] text-amber-500 mt-2 font-medium">⚠ 2 accounts require re-auth</div>
        </div>
      </div>

      {/* Campaigns list and Recent logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left block (Campaigns Status) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">📋 Live Outreach Campaigns</h3>
          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/30 text-xs font-bold text-zinc-500">
                  <th className="p-4">Campaign Name</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">Delivered</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                <tr className="border-b border-zinc-800/60 hover:bg-zinc-800/10 transition-all">
                  <td className="p-4 font-semibold text-white">Q3 Software Engineer Outreach</td>
                  <td className="p-4"><span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Running</span></td>
                  <td className="p-4">124 / 450</td>
                  <td className="p-4">98%</td>
                </tr>
                <tr className="border-b border-zinc-800/60 hover:bg-zinc-800/10 transition-all">
                  <td className="p-4 font-semibold text-white">Direct Sourcing – Product Managers</td>
                  <td className="p-4"><span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700/50">Draft</span></td>
                  <td className="p-4">0 / 84</td>
                  <td className="p-4">—</td>
                </tr>
                <tr className="hover:bg-zinc-800/10 transition-all">
                  <td className="p-4 font-semibold text-white">Candidate Warmups (August)</td>
                  <td className="p-4"><span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Scheduled</span></td>
                  <td className="p-4">0 / 1200</td>
                  <td className="p-4">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right block (Sender Rotation telemetry stats) */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">⚙️ Sender Health Rotation</h3>
          <div className="border border-zinc-800 rounded-xl bg-zinc-900/10 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
              <span className="text-xs font-semibold text-zinc-300">recruiter@getacme.com</span>
              <span className="text-[10px] text-emerald-400 font-bold">100% Health</span>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
              <span className="text-xs font-semibold text-zinc-300">talent@getacme.com</span>
              <span className="text-[10px] text-emerald-400 font-bold">100% Health</span>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
              <span className="text-xs font-semibold text-zinc-300">hr.support@getacme.com</span>
              <span className="text-[10px] text-amber-500 font-bold">Reputation Warmup</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">career.acme@gmail.com</span>
              <span className="text-[10px] text-red-500 font-bold">Re-auth Required</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
