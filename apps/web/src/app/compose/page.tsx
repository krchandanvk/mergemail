import React from 'react';

export default function ComposePage() {
  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">✍️ Create Email Campaign</h2>
        <p className="text-sm text-zinc-400">
          Build a personalized cold outreach template. Upload custom CSV variables to populate tags.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column - Form & Editor (60% width) */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          
          {/* Campaign Config */}
          <div className="border border-zinc-800 bg-zinc-900/10 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400">Campaign Name</label>
              <input className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" placeholder="Q3 Candidate Outreach" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400">CSV Contact Source</label>
              <div className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 transition-all rounded-xl p-6 text-center cursor-pointer flex flex-col items-center gap-2">
                <span className="text-xl">📂</span>
                <span className="text-xs text-zinc-300 font-semibold">Drop your CSV here or click to browse</span>
                <span className="text-[10px] text-zinc-500">Supports headers: Name, Email, Company, Role, etc.</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400">Subject Line</label>
              <input className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" placeholder="Hi {{name}}, quick note regarding {{company}}" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400">Email Template Body</label>
              <div className="border border-zinc-800 bg-zinc-900 rounded-lg p-3 flex flex-col gap-3">
                
                {/* Editor Toolbar */}
                <div className="flex gap-1 border-b border-zinc-800 pb-2">
                  <button className="px-2 py-1 rounded hover:bg-zinc-800 text-[10px] font-bold text-zinc-400">B</button>
                  <button className="px-2 py-1 rounded hover:bg-zinc-800 text-[10px] italic text-zinc-400">I</button>
                  <button className="px-2 py-1 rounded hover:bg-zinc-800 text-[10px] underline text-zinc-400">U</button>
                  <button className="px-2 py-1 rounded hover:bg-zinc-800 text-[10px] text-zinc-400">• List</button>
                  <button className="px-2 py-1 rounded hover:bg-zinc-800 text-[10px] text-zinc-400">🔗 Link</button>
                </div>

                {/* Editor textarea */}
                <textarea className="bg-transparent focus:outline-none text-xs text-white min-h-[140px] resize-none leading-relaxed" placeholder="Hi {{name | default:'there'}},&#10;&#10;I saw your profile and wanted to reach out regarding the {{role}} opening at {{company}}..."></textarea>
              </div>
            </div>

            <button className="px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-xs font-bold text-white transition-all shadow-lg shadow-indigo-600/20">
              🚀 Launch Mail Merge Campaign
            </button>
          </div>

        </div>

        {/* Right Column - Personalization & Validation Preview (40% width) */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          
          {/* Live Preview Console */}
          <div className="border border-zinc-800 bg-zinc-900/10 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">👁️ Live Personalization</h3>
              <select className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-300 focus:outline-none">
                <option>Preview: Recipient #1</option>
                <option>Preview: Recipient #2</option>
              </select>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500">Subject</span>
                <div className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 mt-1">
                  Hi <span className="bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-mono">John Doe</span>, quick note...
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500">Body Preview</span>
                <div className="px-3 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 mt-1 min-h-[140px] leading-relaxed">
                  Hi <span className="bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-mono">John Doe</span>,<br/><br/>
                  I saw your profile and wanted to reach out regarding the <span className="bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-mono">Software Engineer</span> opening at <span className="bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-mono">Google</span>...
                </div>
              </div>
            </div>
          </div>

          {/* Validation Checklist */}
          <div className="border border-zinc-800 bg-zinc-900/10 rounded-xl p-5 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/60 pb-2">🔍 Pre-Send Validation</h3>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-start gap-2.5 text-xs text-emerald-400">
                <span className="text-sm">✓</span>
                <div>
                  <div className="font-semibold">Valid Email Formats</div>
                  <p className="text-[10px] text-zinc-500">All contact addresses are syntactically sound.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-amber-400">
                <span className="text-sm">⚠️</span>
                <div>
                  <div className="font-semibold">Missing fallbacks detected</div>
                  <p className="text-[10px] text-zinc-500">Some fields are empty. Use tag syntax: <code className="text-amber-300 font-mono text-[9px]">{"{{name | default:'there'}}"}</code></p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
