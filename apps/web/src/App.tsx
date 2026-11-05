import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { HeroLandingPage } from './pages/HeroLandingPage';
import { ProblemListPage } from './pages/ProblemListPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AlgorithmsPage } from './pages/AlgorithmsPage';
import { AlgorithmDetailPage } from './pages/AlgorithmDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { CreateProblemPage } from './pages/CreateProblemPage';
import { AdminProblemReviewPage } from './pages/AdminProblemReviewPage';
import { AdminProblemManagementPage } from './pages/AdminProblemManagementPage';
import { useAuthStore } from './store/useAuthStore';
import { Sparkles, ArrowRight, Cpu, ArrowLeftRight, Menu } from 'lucide-react';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '1000000000000-dummygoogleclientidforinitialization.apps.googleusercontent.com';

function HomeRoute() {
  const { isAuthenticated } = useAuthStore();
  // Pre-login shows the world-class Hero landing page.
  // Post-login seamlessly directs to the student workspace & dashboard.
  if (isAuthenticated) {
    return <DashboardPage />;
  }
  return <HeroLandingPage />;
}

function AppLayout() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Sidebar is shown ONLY when logged in and not on authentication screens
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const showSidebar = isAuthenticated && !isAuthPage;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-100 dark:selection:bg-emerald-900 selection:text-emerald-950 dark:selection:text-emerald-100 font-sans transition-colors duration-200">
      {/* Top Utility Header Bar with Profile & Logout dropdown */}
      {!isAuthPage && (
        <TopHeader
          showSidebarToggle={showSidebar}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
      )}

      <div className="flex-1 flex relative">
        {showSidebar && (
          <Sidebar
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        )}
        <div className={`flex-1 flex flex-col min-w-0 transition-[padding] duration-300 ${showSidebar ? 'md:pl-16' : ''}`}>
          <main className="flex-1 flex flex-col min-w-0">
            <Routes>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/problems" element={<ProblemListPage />} />
              <Route path="/algorithms" element={<AlgorithmsPage />} />
              <Route path="/algorithms/:slug" element={<AlgorithmDetailPage />} />
              <Route path="/workspace/:id" element={<WorkspacePage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/create-problem" element={<CreateProblemPage />} />
              <Route path="/admin/proposals" element={<AdminProblemReviewPage />} />
              <Route path="/admin/problems" element={<AdminProblemManagementPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </main>
          <footer className="border-t border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 py-10 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">AI Code Evolution Lab</span>
                <span className="text-slate-400 dark:text-slate-600">&bull;</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px] font-semibold">GV2 Release</span>
              </div>
              <div className="flex items-center gap-6 text-slate-600 dark:text-slate-400">
                <Link to="/problems" className="hover:text-slate-900 dark:hover:text-white transition">Catalog</Link>
                <Link to="/algorithms" className="hover:text-slate-900 dark:hover:text-white transition">Visualizer</Link>
                <Link to="/leaderboard" className="hover:text-slate-900 dark:hover:text-white transition">Rankings</Link>
                <a
                  href="https://github.com/mohankunjam25-hue/AiCA"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-900 dark:hover:text-white transition"
                >
                  GitHub
                </a>
              </div>
              <p className="text-slate-400 dark:text-slate-500">
                &copy; {new Date().getFullYear()} Team AICA. Built for collaborative code analysis.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
