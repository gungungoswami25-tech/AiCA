import { Link, useNavigate } from 'react-router-dom';
import { Trophy, BarChart2, BookOpen, LogOut, User as UserIcon, Workflow } from 'lucide-react';
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

          {isAuthenticated ? (
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-200">
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 text-xs sm:text-sm transition"
              >
                <BarChart2 className="w-4 h-4 text-teal-600" />
                Dashboard
              </Link>
              <span className="text-xs text-slate-700 font-medium flex items-center gap-1.5 font-mono bg-slate-100 px-2.5 py-1 rounded-lg">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={user?.username}
                    className="w-5 h-5 rounded-full object-cover border border-indigo-500/30"
                  />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                )}
                {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 font-medium text-xs transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
