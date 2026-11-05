import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Navbar } from './components/Navbar';
import { ProblemListPage } from './pages/ProblemListPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { Sparkles, ArrowRight, ShieldCheck, Cpu, ArrowLeftRight } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1000000000000-dummygoogleclientidforinitialization.apps.googleusercontent.com';

function LandingPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono">
        <Sparkles className="w-3.5 h-3.5" />
        Empirical Telemetry meets Pedagogical AI Insights
      </div>

      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
        Understand how code{' '}
        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          evolves
        </span>
        , not just if it passes.
      </h1>

      <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
        Submit solutions in Python, JavaScript, C++, or Java. Receive isolated Judge0 execution metrics, deterministic edge-case verification, and AI-powered complexity analysis.
      </p>

      <div className="flex gap-4">
        <Link
          to="/problems"
          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-semibold text-white shadow-lg shadow-indigo-600/25 transition flex items-center gap-2 text-sm"
        >
          Explore Problem Catalog
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/leaderboard"
          className="px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 font-semibold text-slate-300 transition text-sm"
        >
          View Leaderboards
        </Link>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full pt-8 text-left">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200 text-base">Isolated Execution</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Code runs inside hardened Judge0 sandboxes with zero host access, strict CPU/RAM cgroups, and network isolation.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 w-fit">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200 text-base">AI Big-O & Bug Diagnostics</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Separated from empirical numbers, Gemini 1.5 analyzes asymptotic Big-O bounds, code smells, and diagnoses edge-case flaws.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200 text-base">Solution Evolution Diff</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Compare brute-force and optimal solutions side-by-side with delta metrics and an AI evolutionary narrative.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/problems" element={<ProblemListPage />} />
              <Route path="/workspace/:id" element={<WorkspacePage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </main>
          <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
            AI Code Evolution Lab &copy; 2026 &bull; Developed by Team AICA &bull; Monorepo Turbo + pnpm
          </footer>
        </div>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
