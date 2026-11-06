import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  User as UserIcon,
  Settings,
  Award,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { ThemeToggle } from './ThemeToggle';

interface TopHeaderProps {
  onOpenMobileSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export function TopHeader({ onOpenMobileSidebar, showSidebarToggle = false }: TopHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { user, profile, isAuthenticated, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
      }
    }

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    setIsProfileOpen(false);
    navigate(path);
  };

  // Determine page title context for top bar
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Overview & Highlights';
    if (path.startsWith('/problems')) return 'Problem Catalog';
    if (path.startsWith('/algorithms')) return 'Algorithm Visualizer';
    if (path.startsWith('/workspace')) return 'Interactive Code Lab';
    if (path.startsWith('/leaderboard')) return 'Global Leaderboards';
    if (path.startsWith('/dashboard')) return 'Developer Dashboard';
    if (path.startsWith('/profile')) return 'Developer Profile';
    return 'AI Code Evolution Lab';
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 transition-colors duration-200">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left Section: Mobile Menu Trigger + Brand/Context */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Trigger (shown only when sidebar is available) */}
          {showSidebarToggle && (
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              aria-label="Open Navigation Drawer"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Logo & Context Title */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-transparent">
              <img src="/logo.png" alt="AI Code Lab Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                AI Code Evolution Lab
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                GV2
              </span>
            </div>
          </Link>

          {/* Authenticated breadcrumb */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {getPageTitle()}
              </span>
            </div>
          )}

          {/* Guest Landing Navigation Links */}
          {!isAuthenticated && location.pathname === '/' && (
            <nav className="hidden md:flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 font-medium ml-3">
              <a
                href="#live-diff"
                className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 transition"
              >
                Live Diff
              </a>
              <a
                href="#pipeline"
                className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 transition"
              >
                Pipeline
              </a>
              <a
                href="#features"
                className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 transition"
              >
                Features
              </a>
              <a
                href="#methodology"
                className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 transition"
              >
                Pedagogy
              </a>
            </nav>
          )}
        </div>

        {/* Right Section: Theme Toggle + Profile / Logout Dropdown */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <div className="relative">
              {/* Profile Avatar Chip Trigger */}
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-2 p-1 sm:pl-1.5 sm:pr-2.5 rounded-full border transition cursor-pointer group ${
                  isProfileOpen
                    ? 'bg-slate-100 dark:bg-slate-800 border-emerald-500/50 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                <div className="relative shrink-0">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={user?.username}
                      className="w-7 h-7 rounded-full object-cover border border-emerald-500/50 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold border border-emerald-500/30">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                </div>

                <span className="hidden sm:inline text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                  {user?.username}
                </span>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200 ${
                    isProfileOpen ? 'rotate-180 text-emerald-500' : ''
                  }`}
                />
              </button>

              {/* Professional Profile Dropdown Menu */}
              {isProfileOpen && (
                <div
                  ref={dropdownRef}
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-900/15 dark:shadow-slate-950/90 p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* User Profile Overview */}
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        {profile?.avatarUrl ? (
                          <img
                            src={profile.avatarUrl}
                            alt={user?.username}
                            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/40"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-sm font-bold text-emerald-700 dark:text-emerald-300 border-2 border-emerald-500/30">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {profile?.fullName || user?.username}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                          @{user?.username}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {user?.email || 'student@aica.dev'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        Level 4 • Diamond Dev
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                        GV2
                      </span>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-0.5 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => handleNavigate('/profile')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition cursor-pointer text-left"
                    >
                      <UserIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Your Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigate('/profile?tab=settings')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition cursor-pointer text-left"
                    >
                      <Settings className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                      <span>Account Settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigate('/profile?tab=activity')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition cursor-pointer text-left"
                    >
                      <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      <span>Activity & Badges</span>
                    </button>

                    {/* Inline Theme Switcher inside Dropdown */}
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        {isDark ? (
                          <Moon className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Sun className="w-4 h-4 text-amber-500" />
                        )}
                        <span>Theme Mode</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {isDark ? 'Dark' : 'Light'}
                      </span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1.5" />

                  {/* Professional Logout Option */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
