import { Link, useNavigate } from 'react-router-dom';
import { Code2, Trophy, BarChart2, BookOpen, LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
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

        <nav className="flex items-center gap-1 sm:gap-4 text-sm font-medium">
          <Link
            to="/problems"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            Problems
          </Link>
          <Link
            to="/leaderboard"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            Leaderboards
          </Link>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            Dashboard
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-3 ml-3 pl-3 border-l border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-3">
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition"
              >
                Sign In
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
