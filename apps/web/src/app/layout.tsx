import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Universal Mail Merger — SaaS Outreach Platform',
  description: 'Enterprise personalized one-to-one cold email campaigns with SMTP rotation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#09090b] text-[#e4e4e7] min-h-screen flex flex-col font-sans">
        
        {/* Navigation Topbar */}
        <header className="border-b border-[#27272a] bg-[#18181b]/50 backdrop-blur sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              ✉️
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-indigo-300 bg-clip-text text-transparent">
                Universal Mail Merger
              </h1>
              <p className="text-[10px] text-zinc-500">Enterprise SaaS Workstation</p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            <a href="/dashboard" className="px-3 py-1.5 rounded-md text-xs font-semibold text-zinc-400 hover:text-white transition-all">
              📊 Dashboard
            </a>
            <a href="/compose" className="px-3 py-1.5 rounded-md text-xs font-semibold text-zinc-400 hover:text-white transition-all">
              ✍️ Compose
            </a>
            <a href="/campaigns" className="px-3 py-1.5 rounded-md text-xs font-semibold text-zinc-400 hover:text-white transition-all">
              📋 Campaigns
            </a>
            <a href="/analytics" className="px-3 py-1.5 rounded-md text-xs font-semibold text-zinc-400 hover:text-white transition-all">
              📈 Analytics
            </a>
            <a href="/settings" className="px-3 py-1.5 rounded-md text-xs font-semibold text-zinc-400 hover:text-white transition-all">
              ⚙️ Settings
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">Recruiter Account</span>
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-indigo-400">
              R
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>

        {/* Universal Footer */}
        <footer className="border-t border-[#27272a] bg-[#09090b] py-6 text-center text-xs text-zinc-500">
          One unique email per recipient · Never bulk spam. &copy; {new Date().getFullYear()} Universal Mail Merger.
        </footer>
      </body>
    </html>
  );
}
