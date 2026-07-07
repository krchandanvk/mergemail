import React from 'react';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">⚙️ Workspace Settings</h2>
        <p className="text-sm text-zinc-400">
          Configure SMTP servers, OAuth credentials, daily throttling limits, and signature templates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Settings Navigation Tabs */}
        <div className="flex flex-col gap-1">
          <button className="px-4 py-2.5 rounded-lg text-left text-xs font-bold bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
            ✉️ Email Accounts (SMTP)
          </button>
          <button className="px-4 py-2.5 rounded-lg text-left text-xs font-bold text-zinc-400 hover:bg-zinc-900/50 hover:text-white transition-all">
            👤 User Profile
          </button>
          <button className="px-4 py-2.5 rounded-lg text-left text-xs font-bold text-zinc-400 hover:bg-zinc-900/50 hover:text-white transition-all">
            🔔 Notification Config
          </button>
        </div>

        {/* Settings Configuration Details */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* SMTP Account Form */}
          <div className="border border-zinc-800 bg-zinc-900/10 rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white">Add New Email Account</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400">SMTP Host</label>
                <input className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" placeholder="smtp.gmail.com" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400">SMTP Port</label>
                <input className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" placeholder="465" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400">Username / Email</label>
              <input className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" placeholder="recruiter@company.com" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400">App Password</label>
              <input type="password" className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" placeholder="••••••••••••••••" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400">Daily Throttling Limit</label>
              <div className="flex items-center gap-3">
                <input type="range" min="10" max="500" defaultValue="200" className="flex-1 accent-indigo-500" />
                <span className="text-xs text-zinc-300 font-semibold">200 / day</span>
              </div>
            </div>

            <button className="mt-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-all">
              Save Account Connection
            </button>
          </div>

          {/* Connected Senders Table */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-zinc-400">Connected Accounts</h3>
            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/30 text-xs font-bold text-zinc-500">
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Limit</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  <tr className="border-b border-zinc-800/60">
                    <td className="p-3 font-semibold text-white">recruiter@getacme.com</td>
                    <td className="p-3">200 / day</td>
                    <td className="p-3"><span className="text-emerald-400 font-bold">● Active</span></td>
                  </tr>
                  <tr className="border-b border-zinc-800/60">
                    <td className="p-3 font-semibold text-white">talent@getacme.com</td>
                    <td className="p-3">150 / day</td>
                    <td className="p-3"><span className="text-emerald-400 font-bold">● Active</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
