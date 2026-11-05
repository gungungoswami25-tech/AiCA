import { Link, useNavigate } from 'react-router-dom';
import { Trophy, BarChart2, BookOpen, LogOut, User as UserIcon, Workflow, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export function Navbar() {
  const { user, profile, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-200/90 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1 shadow-sm group-hover:border-slate-700 transition">
            <img src="/logo.png" alt="GV2 Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-emerald-700 transition">
                AI Code Evolution Lab
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                GV2
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Pedagogical Code Evaluation Platform
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3 text-sm font-medium">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-200">
              <Link
                to="/problems"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 text-xs sm:text-sm transition"
              >
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Problems
              </Link>
              <Link
                to="/algorithms"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 text-xs sm:text-sm transition"
              >
                <Workflow className="w-4 h-4 text-indigo-600" />
                Algorithms
              </Link>
              <Link
                to="/leaderboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 text-xs sm:text-sm transition"
              >
                <Trophy className="w-4 h-4 text-amber-600" />
                Leaderboards
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 text-xs sm:text-sm transition"
              >
                <BarChart2 className="w-4 h-4 text-teal-600" />
                Dashboard
              </Link>
              <Link
                to="/create-problem"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-xs sm:text-sm font-semibold transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                AI Creator
              </Link>
              {((user as any)?.role === 'ADMIN' || (user as any)?.role === 'INSTRUCTOR') && (
                <Link
                  to="/admin/proposals"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 text-xs sm:text-sm font-semibold transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Review
                </Link>
              )}
              <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-200">
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 text-xs text-slate-700 font-medium font-mono bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-lg border border-slate-200/60 hover:border-slate-300 transition group"
                  title="View Your Developer Profile"
                >
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={user?.username}
                      className="w-5 h-5 rounded-full object-cover border border-emerald-500/40 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-indigo-600 group-hover:text-indigo-800 transition" />
                  )}
                  <span className="group-hover:text-slate-900 transition">{user?.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Landing Page Quick Navigation Anchors for Guest Visitors */}
              <div className="hidden md:flex items-center gap-1 text-xs sm:text-sm text-slate-600 font-medium mr-2">
                <a
                  href="#live-diff"
                  className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/80 transition"
                >
                  Live Diff
                </a>
                <a
                  href="#pipeline"
                  className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/80 transition"
                >
                  Pipeline
                </a>
                <a
                  href="#features"
                  className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/80 transition"
                >
                  Features
                </a>
                <a
                  href="#methodology"
                  className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100/80 transition"
                >
                  Pedagogy
                </a>
              </div>
              <div className="flex items-center gap-2 ml-1">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 font-medium text-xs transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="relative group px-4 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-medium text-xs shadow-sm hover:shadow transition overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    Get Started
                    <span className="text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                  </span>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform ease-out" />
                </Link>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
