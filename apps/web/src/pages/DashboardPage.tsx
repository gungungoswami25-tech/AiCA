import { Link } from 'react-router-dom';
import {
  BarChart2,
  CheckCircle2,
  XCircle,
  Flame,
  Code2,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export function DashboardPage() {
  const { user } = useAuthStore();

  const stats = {
    solved: 5,
    total: 14,
    streak: 3,
    accuracy: 78.5
  };

  const recentSubmissions = [
    {
      id: 'sub-1',
      problemTitle: 'Two Sum Optimal',
      language: 'python',
      verdict: 'ACCEPTED',
      timeMs: 38,
      memoryKb: 14200,
      score: 94.6,
      date: '10 minutes ago'
    },
    {
      id: 'sub-2',
      problemTitle: 'Two Sum Optimal',
      language: 'python',
      verdict: 'TIME_LIMIT_EXCEEDED',
      timeMs: 2000,
      memoryKb: 13500,
      score: 0.0,
      date: '25 minutes ago'
    },
    {
      id: 'sub-3',
      problemTitle: 'Longest Substring Without Repeating',
      language: 'javascript',
      verdict: 'ACCEPTED',
      timeMs: 45,
      memoryKb: 22000,
      score: 89.2,
      date: 'Yesterday'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-2xl">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            Welcome back, {user?.username || 'Algorithmic Explorer'}!
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-xl">
            Track your code evolution, compare space-time trade-offs across implementations, and review AI pedagogical reports.
          </p>
        </div>

        <Link
          to="/problems"
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 self-start sm:self-auto"
        >
          Explore Problem Catalog
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Problems Solved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100 font-mono">{stats.solved}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Across Easy & Medium tiers</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Submissions</span>
            <Code2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100 font-mono">{stats.total}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Iterations and test runs</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Accuracy Rate</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100 font-mono">{stats.accuracy}%</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Pass-to-submit ratio</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Active Streak</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100 font-mono">{stats.streak} Days</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Continuous daily practice</span>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-slate-200">Recent Submission History</h2>
        <div className="space-y-3">
          {recentSubmissions.map((sub) => (
            <div
              key={sub.id}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
            >
              <div className="flex items-center gap-3">
                {sub.verdict === 'ACCEPTED' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
                <div>
                  <span className="font-sans font-bold text-slate-200 text-sm block">
                    {sub.problemTitle}
                  </span>
                  <div className="flex items-center gap-2 text-slate-400 mt-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-indigo-300">
                      {sub.language}
                    </span>
                    <span>&bull;</span>
                    <span>{sub.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <span className="text-slate-200 block">{sub.timeMs}ms</span>
                  <span className="text-slate-500 text-[11px]">{Math.round(sub.memoryKb / 1024)}MB</span>
                </div>
                <div className="w-20">
                  <span
                    className={`font-bold block ${
                      sub.verdict === 'ACCEPTED' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {sub.verdict}
                  </span>
                  {sub.score > 0 && <span className="text-slate-400 text-[11px]">Score: {sub.score}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
