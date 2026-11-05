import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HeroLandingPage } from './pages/HeroLandingPage';
import { ProblemListPage } from './pages/ProblemListPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AlgorithmsPage } from './pages/AlgorithmsPage';
import { useAuthStore } from './store/useAuthStore';

function HomeRoute() {
  const { isAuthenticated } = useAuthStore();
  // Pre-login shows the world-class Hero landing page.
  // Post-login seamlessly directs to the student workspace & dashboard.
  if (isAuthenticated) {
    return <DashboardPage />;
  }
  return <HeroLandingPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#FAFAFC] text-slate-900 selection:bg-emerald-100 selection:text-emerald-950 font-sans">
        <Navbar />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/problems" element={<ProblemListPage />} />
            <Route path="/algorithms" element={<AlgorithmsPage />} />
            <Route path="/workspace/:id" element={<WorkspacePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </main>
        <footer className="border-t border-slate-200/90 bg-white py-10 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">AI Code Evolution Lab</span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-emerald-700 font-mono text-[11px] font-semibold">GV2 Release</span>
            </div>
            <div className="flex items-center gap-6 text-slate-600">
              <Link to="/problems" className="hover:text-slate-900 transition">Catalog</Link>
              <Link to="/algorithms" className="hover:text-slate-900 transition">Visualizer</Link>
              <Link to="/leaderboard" className="hover:text-slate-900 transition">Rankings</Link>
              <a
                href="https://github.com/mohankunjam25-hue/AiCA"
                target="_blank"
                rel="noreferrer"
                className="hover:text-slate-900 transition"
              >
                GitHub
              </a>
            </div>
            <p className="text-slate-400">
              &copy; {new Date().getFullYear()} Team AICA. Built for collaborative code analysis.
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
