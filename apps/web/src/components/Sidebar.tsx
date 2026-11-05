import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Workflow,
  Terminal,
  Trophy,
  User as UserIcon,
  LogOut,
  LogIn,
  Sun,
  Moon,
  Sparkles,
  ChevronRight,
  Settings,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
  badgeColor?: string;
  requiresAuth?: boolean;
}

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      description: 'Personal overview & stats',
      requiresAuth: false,
    },
    {
      label: 'Problems',
      path: '/problems',
      icon: BookOpen,
      description: 'Curated coding catalog',
      badge: 'Catalog',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    },
    {
      label: 'Algorithms',
      path: '/algorithms',
      icon: Workflow,
      description: 'Visualizer & patterns',
      badge: 'Visualizer',
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
    },
    {
      label: 'Code Lab',
      path: '/workspace/1',
      icon: Terminal,
      description: 'Interactive IDE sandbox',
      badge: 'IDE',
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    },
    {
      label: 'Leaderboard',
      path: '/leaderboard',
      icon: Trophy,
      description: 'Global rankings & elo',
      badge: 'Rankings',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    },
    {
      label: 'Profile',
      path: '/profile',
      icon: UserIcon,
      description: 'Activity & badges',
      requiresAuth: true,
    },
  ];

  // Close profile popup on click outside or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        profileTriggerRef.current &&
        !profileTriggerRef.current.contains(e.target as Node)
      ) {
        setIsProfilePopupOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsProfilePopupOpen(false);
      }
    }

    if (isProfilePopupOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfilePopupOpen]);

  const handleLogout = () => {
    setIsProfilePopupOpen(false);
    logout();
    navigate('/login');
    if (onCloseMobile) onCloseMobile();
  };

  const handleNavigate = (path: string) => {
    setIsProfilePopupOpen(false);
    navigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  const isActive = (path: string) => {
    if (path === '/workspace/1') {
      return location.pathname.startsWith('/workspace');
    }
    return location.pathname === path;
  };

  const isExpanded = isHovered || mobileOpen;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        aria-label="Application Navigation Sidebar"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        onFocus={() => setIsHovered(true)}
        onBlur={(e) => {
          if (!sidebarRef.current?.contains(e.relatedTarget as Node)) {
            setIsHovered(false);
          }
        }}
        className={`fixed left-0 bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-slate-200/90 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          mobileOpen
            ? 'top-0 z-50 w-72 translate-x-0 shadow-2xl flex'
            : 'top-14 z-20 -translate-x-full md:translate-x-0 md:flex ' +
              (isHovered
                ? 'w-64 shadow-2xl shadow-slate-900/15 dark:shadow-slate-950/80'
                : 'w-16 shadow-xs')
        }`}
      >
        {/* Top Section: Navigation Links */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar pt-2">
          {/* Mobile Drawer Header with Close Button */}
          {mobileOpen && (
            <div className="flex items-center justify-between px-4 pb-2 pt-1 border-b border-slate-200/80 dark:border-slate-800 md:hidden mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Navigation
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Section Indicator */}
          <div className="px-3 pb-1 pt-3 h-7 flex items-center overflow-hidden">
            <div
              className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 transition-all duration-200 ${
                isExpanded ? 'opacity-100 translate-x-0 px-2' : 'opacity-0 -translate-x-2 pointer-events-none'
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>Navigation</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1 px-2 pb-4">
            {navItems.map((item) => {
              if (item.requiresAuth && !isAuthenticated) {
                return null;
              }
              const active = isActive(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (onCloseMobile) onCloseMobile();
                  }}
                  title={!isExpanded ? item.label : undefined}
                  className={`relative flex items-center h-11 rounded-xl transition-all duration-200 group ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {/* Active Accent Bar */}
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-600 dark:bg-emerald-400 rounded-r-full" />
                  )}

                  {/* Fixed-Width Icon Anchor */}
                  <div className="w-12 h-11 flex items-center justify-center shrink-0">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        active
                          ? 'text-emerald-600 dark:text-emerald-400 scale-105'
                          : 'text-slate-500 dark:text-slate-400 group-hover:scale-110 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                      }`}
                    />
                  </div>

                  {/* Smooth Expanding Label */}
                  <div
                    className={`flex-1 flex items-center justify-between pr-3 overflow-hidden whitespace-nowrap transition-all duration-200 ${
                      isExpanded
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-2 pointer-events-none w-0'
                    }`}
                  >
                    <div className="flex flex-col text-left truncate">
                      <span className="text-xs sm:text-sm font-medium leading-none truncate">
                        {item.label}
                      </span>
                      {item.description && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                          {item.description}
                        </span>
                      )}
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${
                          item.badgeColor ||
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Utility & Profile Section */}
        <div className="p-2 border-t border-slate-200/90 dark:border-slate-800/90 space-y-1.5 bg-slate-50/50 dark:bg-slate-950/30 relative">
          {/* ============================================================= */}
          {/* PROFILE QUICK POPUP (Chrome-style floating card)              */}
          {/* ============================================================= */}
          {isAuthenticated && (
            <div
              ref={popupRef}
              role="dialog"
              aria-label="User Profile Quick Menu"
              className={`absolute bottom-full mb-2 left-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-950/25 dark:shadow-slate-950/90 p-4 z-50 transition-all duration-200 ease-out origin-bottom-left ${
                isProfilePopupOpen
                  ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
              }`}
            >
              {/* User Avatar & Identity Header (Clickable -> View Profile) */}
              <button
                type="button"
                onClick={() => handleNavigate('/profile')}
                className="w-full flex items-center gap-3 p-2 -mx-1 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition text-left group cursor-pointer"
              >
                <div className="relative shrink-0">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={user?.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/50 group-hover:border-emerald-500 transition"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-base font-bold text-emerald-700 dark:text-emerald-300 border-2 border-emerald-500/40">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                      {profile?.fullName || user?.username}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    @{user?.username}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {user?.email || 'student@aica.dev'}
                  </p>
                </div>
              </button>

              {/* Status Pill */}
              <div className="mt-2.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                  GV2 Student Dev
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                  Active
                </span>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 my-3" />

              {/* Quick Actions List */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleNavigate('/profile')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>View Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigate('/profile?tab=settings')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span>Settings</span>
                </button>

                {/* Inline Theme Toggle inside Quick Popup */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {isDark ? (
                      <Moon className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-500" />
                    )}
                    <span>Theme ({isDark ? 'Dark' : 'Light'})</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Switch
                  </span>
                </button>

                <div className="border-t border-slate-100 dark:border-slate-800/80 my-1.5" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}

          {/* Theme Quick Switcher in Sidebar */}
          <button
            onClick={toggleTheme}
            type="button"
            title={!isExpanded ? `Theme: ${isDark ? 'Dark' : 'Light'}` : undefined}
            className="relative w-full flex items-center h-10 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition group cursor-pointer"
          >
            <div className="w-12 h-10 flex items-center justify-center shrink-0">
              {isDark ? (
                <Moon className="w-4 h-4 text-amber-400 transition-transform duration-300 group-hover:-rotate-12" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500 transition-transform duration-300 group-hover:rotate-45" />
              )}
            </div>

            <div
              className={`flex-1 flex items-center justify-between pr-3 overflow-hidden whitespace-nowrap transition-all duration-200 ${
                isExpanded
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 -translate-x-2 pointer-events-none w-0'
              }`}
            >
              <span className="text-xs font-medium">
                {isDark ? 'Dark Theme' : 'Light Theme'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {isDark ? 'ON' : 'OFF'}
              </span>
            </div>
          </button>

          {/* Profile Section Trigger (Avatar + Username) */}
          {isAuthenticated ? (
            <button
              ref={profileTriggerRef}
              type="button"
              onClick={() => setIsProfilePopupOpen(!isProfilePopupOpen)}
              title={!isExpanded ? `Profile (${user?.username})` : undefined}
              className={`relative w-full flex items-center h-12 rounded-xl border transition overflow-hidden text-left cursor-pointer group ${
                isProfilePopupOpen
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {/* Fixed 48px avatar anchor */}
              <div className="w-12 h-12 flex items-center justify-center shrink-0">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={user?.username}
                    className="w-7 h-7 rounded-full object-cover border border-emerald-500/50 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              {/* Smooth Expanding User Details */}
              <div
                className={`flex-1 flex items-center justify-between pr-3 overflow-hidden whitespace-nowrap transition-all duration-200 ${
                  isExpanded
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 -translate-x-2 pointer-events-none w-0'
                }`}
              >
                <div className="flex flex-col truncate">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.username}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    Student Dev
                  </span>
                </div>

                <ChevronRight
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isProfilePopupOpen ? 'rotate-90 text-emerald-500' : 'group-hover:translate-x-0.5'
                  }`}
                />
              </div>
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
              }}
              title={!isExpanded ? 'Sign In' : undefined}
              className="relative flex items-center h-10 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition group"
            >
              <div className="w-12 h-10 flex items-center justify-center shrink-0">
                <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
              </div>
              <div
                className={`flex-1 flex items-center justify-between pr-3 overflow-hidden whitespace-nowrap transition-all duration-200 ${
                  isExpanded
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 -translate-x-2 pointer-events-none w-0'
                }`}
              >
                <span className="text-xs font-medium">Sign In</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </div>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
