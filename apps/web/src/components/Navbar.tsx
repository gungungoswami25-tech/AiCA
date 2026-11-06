import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Trophy,
  BarChart2,
  BookOpen,
  LogOut,
  User as UserIcon,
  Workflow,
  ShieldCheck,
  PlusCircle,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const { user, profile, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <header className="border-b border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link to="/" onClick={closeMobile} className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-1 shadow-xs group-hover:border-slate-700 transition">
            <img src="/logo.png" alt="GV2 Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">
              AI Code Evolution Lab
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
              GV2
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs sm:text-sm font-medium">
          {isAuthenticated ? (
            <>
              <Link
                to="/problems"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  location.pathname === '/problems'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Problems
              </Link>
              <Link
                to="/algorithms"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  location.pathname === '/algorithms'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Workflow className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Algorithms
              </Link>
              <Link
                to="/leaderboard"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  location.pathname === '/leaderboard'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Leaderboards
              </Link>
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  location.pathname === '/dashboard'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Dashboard
              </Link>

              {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                <>
                  <Link
                    to="/admin/problems?create=true"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs font-semibold border border-purple-200/60 dark:border-purple-800 transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    Create Question
                  </Link>
                  <Link
                    to="/admin/problems"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-xs font-semibold transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Manage Catalog
                  </Link>
                </>
              )}

              <ThemeToggle className="ml-1" />

              <div className="flex items-center gap-2 ml-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700 transition group"
                >
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={user?.username}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  )}
                  <span>{user?.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 font-medium mr-2">
                <a href="#live-diff" className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white transition">
                  Live Diff
                </a>
                <a href="#pipeline" className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white transition">
                  Pipeline
                </a>
                <a href="#features" className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white transition">
                  Features
                </a>
              </div>

              <ThemeToggle className="mr-1" />

              <div className="flex items-center gap-2 ml-1">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-lg bg-slate-950 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition"
                >
                  Get Started &rarr;
                </Link>
              </div>
            </>
          )}
        </nav>

        {/* Mobile Actions: ThemeToggle + Hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-4 space-y-2 text-xs">
          {isAuthenticated ? (
            <>
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={user?.username} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-indigo-500" />
                  )}
                  <span className="font-bold text-slate-900 dark:text-white">{user?.username}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-slate-500">
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/problems"
                  onClick={closeMobile}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-800 dark:text-slate-200"
                >
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  Problems
                </Link>
                <Link
                  to="/algorithms"
                  onClick={closeMobile}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-800 dark:text-slate-200"
                >
                  <Workflow className="w-4 h-4 text-indigo-500" />
                  Algorithms
                </Link>
                <Link
                  to="/leaderboard"
                  onClick={closeMobile}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-800 dark:text-slate-200"
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Leaderboards
                </Link>
                <Link
                  to="/dashboard"
                  onClick={closeMobile}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-800 dark:text-slate-200"
                >
                  <BarChart2 className="w-4 h-4 text-teal-500" />
                  Dashboard
                </Link>
              </div>

              {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Staff Controls</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Link
                      to="/admin/problems?create=true"
                      onClick={closeMobile}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200/60 dark:border-purple-800"
                    >
                      <PlusCircle className="w-4 h-4 text-purple-500" />
                      Create Question
                    </Link>
                    <Link
                      to="/admin/problems"
                      onClick={closeMobile}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/60 dark:border-indigo-800"
                    >
                      <ShieldCheck className="w-4 h-4 text-indigo-500" />
                      Manage Catalog
                    </Link>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <Link
                  to="/profile"
                  onClick={closeMobile}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  View Profile Settings
                </Link>
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                to="/login"
                onClick={closeMobile}
                className="block w-full py-2.5 text-center rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={closeMobile}
                className="block w-full py-2.5 text-center rounded-xl bg-slate-950 dark:bg-emerald-600 text-white font-semibold shadow-xs"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
