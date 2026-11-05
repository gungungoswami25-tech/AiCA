import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Code2, Trophy, BarChart2, BookOpen, Sparkles } from 'lucide-react';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        {/* Navigation Bar */}
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                  AI Code Evolution Lab
                </span>
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                  v2.0
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-1 sm:gap-6 text-sm font-medium">
              <Link to="/problems" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Problems
              </Link>
              <Link to="/leaderboard" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition">
                <Trophy className="w-4 h-4 text-amber-400" />
                Leaderboard
              </Link>
              <Link to="/dashboard" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                Dashboard
              </Link>
              <Link to="/login" className="ml-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition">
                Sign In
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero / Main Placeholder */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Empirical Telemetry meets Pedagogical AI Insights
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
            Understand how code <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">evolves</span>, not just if it passes.
          </h1>
          <p className="mt-6 text-lg text-slate-400 max-w-2xl leading-relaxed">
            Submit solutions in Python, JavaScript, C++, or Java. Receive sandboxed execution metrics, deterministic edge-case verification, and structured AI complexity analysis.
          </p>
          <div className="mt-8 flex gap-4">
            <Link to="/problems" className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-semibold shadow-lg shadow-indigo-500/25 transition">
              Explore Problems
            </Link>
            <Link to="/leaderboard" className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 font-semibold text-slate-300 transition">
              View Leaderboard
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
          AI Code Evolution Lab &copy; 2026 &bull; Developed by Team AICA &bull; Monorepo Turbo + pnpm
        </footer>
      </div>
    </BrowserRouter>
  );
}
