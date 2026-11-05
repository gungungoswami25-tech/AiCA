import { Link } from 'react-router-dom';
import {
  BarChart2,
  CheckCircle2,
  XCircle,
  Flame,
  Code2,
  Trophy,
  ArrowRight,
  User as UserIcon,
  Zap,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export function DashboardPage() {
  const { user, profile } = useAuthStore();

  const stats = {
    solved: profile?.problemsSolved || 14,
    total: profile?.totalSubmissions || 42,
    streak: profile?.currentStreak || 5,
    speedupAvg: '98.4%'
  };

  const recentSubmissions = [
    {
      id: 'sub-1',
      problemId: 'two-sum-optimal',
      problemTitle: 'Two Sum',
      language: 'python',
      verdict: 'ACCEPTED',
      timeMs: 18,
      memoryKb: 15300,
      score: 98.7,
      date: '2 hours ago'
    },
    {
      id: 'sub-2',
      problemId: 'longest-substring-without-repeating',
      problemTitle: 'Longest Substring Without Repeating',
      language: 'typescript',
      verdict: 'ACCEPTED',
      timeMs: 14,
      memoryKb: 37100,
      score: 98.5,
      date: 'Yesterday'
    },
    {
      id: 'sub-3',
      problemId: 'valid-parentheses',
      problemTitle: 'Valid Parentheses',
      language: 'cpp',
      verdict: 'ACCEPTED',
      timeMs: 2,
      memoryKb: 8100,
      score: 98.3,
      date: '3 days ago'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            GV2 Student Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {profile?.fullName || user?.username || 'Algorithmic Explorer'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
            Monitor real-time sandbox executions, review Gemini AST evolutionary diffs, and inspect your algorithmic speedup metrics.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <Link
            to="/profile"
            className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition flex items-center gap-2"
          >
            <UserIcon className="w-4 h-4 text-emerald-400" />
            View Full Profile
          </Link>
          <Link
            to="/problems"
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
          >
            Solve Problems
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Problems Solved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">{stats.solved}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Across catalog challenges</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Runs</span>
            <Code2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">{stats.total}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Judge0 sandbox evaluations</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Speedup</span>
            <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">{stats.speedupAvg}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">O(N²) to O(N) reduction</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Streak</span>
            <Flame className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">{stats.streak} Days</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Daily algorithmic consistency</span>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Submission History</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your latest algorithmic kernel test executions</p>
          </div>
          <Link
            to="/profile"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1"
          >
            View Complete History
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {recentSubmissions.map((sub) => (
            <div
              key={sub.id}
              className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <Link
                    to={`/workspace/${sub.problemId}`}
                    className="font-bold text-slate-900 dark:text-slate-100 text-sm hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                  >
                    {sub.problemTitle}
                  </Link>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-0.5 font-mono text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase font-semibold">
                      {sub.language}
                    </span>
                    <span>&bull;</span>
                    <span>{sub.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-right font-mono">
                <div>
                  <span className="text-slate-900 dark:text-slate-100 font-bold block">{sub.timeMs}ms</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">{Math.round(sub.memoryKb / 1024)}MB</span>
                </div>
                <div className="w-24">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded text-[11px] block">
                    ACCEPTED
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] block mt-0.5">-{sub.score}% latency</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
