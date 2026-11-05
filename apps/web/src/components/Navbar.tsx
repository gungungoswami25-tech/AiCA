import { Link, useNavigate } from 'react-router-dom';
import { Trophy, BarChart2, BookOpen, LogOut, User as UserIcon, Workflow, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const { user, profile, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1 shadow-sm group-hover:border-slate-700 transition">
            <img src="/logo.png" alt="GV2 Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">
                AI Code Evolution Lab
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                GV2
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Pedagogical Code Evaluation Platform
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2.5 text-sm font-medium">
          {isAuthenticated ? (
            <div className="flex items-center gap-1 sm:gap-2 ml-1 pl-2 border-l border-slate-200 dark:border-slate-800">
              <Link
                to="/problems"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 text-xs sm:text-sm transition"
              >
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Problems
              </Link>
              <Link
                to="/algorithms"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 text-xs sm:text-sm transition"
              >
                <Workflow className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Algorithms
              </Link>
              <Link
                to="/leaderboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 text-xs sm:text-sm transition"
              >
                <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Leaderboards
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 text-xs sm:text-sm transition"
              >
                <BarChart2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Dashboard
              </Link>

              <ThemeToggle className="ml-1" />

              <div className="flex items-center gap-2 ml-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium font-mono bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700 transition group"
                  title="View Your Developer Profile"
                >
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={user?.username}
                      className="w-5 h-5 rounded-full object-cover border border-emerald-500/40 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-800 dark:group-hover:text-indigo-300 transition" />
                  )}
                  <span className="group-hover:text-slate-900 dark:group-hover:text-white transition">{user?.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Landing Page Quick Navigation Anchors for Guest Visitors */}
              <div className="hidden md:flex items-center gap-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mr-2">
                <a
                  href="#live-diff"
                  className="px-3 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 transition"
                >
                  Live Diff
                </a>
                <a
                  href="#pipeline"
                  className="px-3 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 transition"
                >
                  Pipeline
                </a>
                <a
                  href="#features"
                  className="px-3 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 transition"
                >
                  Features
                </a>
                <a
                  href="#methodology"
                  className="px-3 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 transition"
                >
                  Pedagogy
                </a>
              </div>

              <ThemeToggle className="mr-1" />

              <div className="flex items-center gap-2 ml-1">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-xs transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="relative group px-4 py-1.5 rounded-lg bg-slate-950 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-medium text-xs shadow-sm hover:shadow transition overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    Get Started
                    <span className="text-emerald-400 dark:text-white font-bold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
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
