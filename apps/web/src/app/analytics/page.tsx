import React from 'react';

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">📈 Campaign Analytics</h2>
        <p className="text-sm text-zinc-400">
          Analyze delivery performance, open conversions, reply behaviors, and rotation diagnostics.
        </p>
      </div>

      {/* Conversion Funnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric Cards */}
        <div className="border border-zinc-800 bg-zinc-900/10 rounded-xl p-5 flex flex-col gap-2">
          <span className="text-[10px] uppercase font-bold text-zinc-500">Total Emails Processed</span>
          <span className="text-4xl font-extrabold text-white">12,450</span>
          <span className="text-[10px] text-emerald-400 font-medium">✓ 99.4% Delivery Success</span>
        </div>

        <div className="border border-zinc-800 bg-zinc-900/10 rounded-xl p-5 flex flex-col gap-2">
          <span className="text-[10px] uppercase font-bold text-zinc-500">Unresolved Variables</span>
          <span className="text-4xl font-extrabold text-white">0.05%</span>
          <span className="text-[10px] text-emerald-400 font-medium">▼ -0.2% since fallback engine update</span>
        </div>

        <div className="border border-zinc-800 bg-zinc-900/10 rounded-xl p-5 flex flex-col gap-2">
          <span className="text-[10px] uppercase font-bold text-zinc-500">Average Open Rate</span>
          <span className="text-4xl font-extrabold text-white">68.4%</span>
          <span className="text-[10px] text-indigo-400 font-medium">▲ Higher personalization score</span>
        </div>

      </div>

      {/* Senders Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="border border-zinc-800 bg-zinc-900/10 rounded-xl p-5 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">🔥 Top Performing Templates</h3>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2 text-xs">
              <span className="text-white font-semibold">Q3 Developer Outreach (Subject Version A)</span>
              <span className="text-emerald-400 font-bold">78.5% Open Rate</span>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2 text-xs">
              <span className="text-white font-semibold">Product Managers Warmup (Subject Version B)</span>
              <span className="text-emerald-400 font-bold">64.2% Open Rate</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white font-semibold">Sourcing Intro (Generic Template)</span>
              <span className="text-amber-500 font-bold">38.1% Open Rate</span>
            </div>
          </div>
        </div>

        <div className="border border-zinc-800 bg-zinc-900/10 rounded-xl p-5 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">📦 Reputation warmups</h3>
          
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2">
              <span className="text-zinc-300">recruiter@getacme.com</span>
              <span className="text-emerald-400 font-bold">0% Bounce Rate</span>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2">
              <span className="text-zinc-300">talent@getacme.com</span>
              <span className="text-emerald-400 font-bold">0.4% Bounce Rate</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">hr.support@getacme.com</span>
              <span className="text-amber-500 font-bold">Warmup phase</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
