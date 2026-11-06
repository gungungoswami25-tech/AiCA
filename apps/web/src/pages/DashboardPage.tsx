import { useState, useEffect } from 'react';
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
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';

interface SubmissionItem {
  id: string;
  problemId: string;
  problemTitle: string;
  language: string;
  verdict: string;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  compositeScore?: number;
  createdAt: string;
}

export function DashboardPage() {
  const { user, profile } = useAuthStore();
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [stats, setStats] = useState({
    solved: profile?.problemsSolved || 0,
    total: profile?.totalSubmissions || 0,
    streak: profile?.currentStreak || 0,
    longestStreak: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        const [subRes, heatRes] = await Promise.allSettled([
          api.get('/submissions/my?limit=5'),
          api.get('/submissions/activity-heatmap')
        ]);

        if (isMounted) {
          if (subRes.status === 'fulfilled' && subRes.value.data?.data?.submissions) {
            setSubmissions(subRes.value.data.data.submissions);
          }
          if (heatRes.status === 'fulfilled' && heatRes.value.data?.data) {
            const h = heatRes.value.data.data;
            setStats({
              solved: h.problemsSolved ?? profile?.problemsSolved ?? 0,
              total: h.totalSubmissions ?? profile?.totalSubmissions ?? 0,
              streak: h.currentStreak ?? profile?.currentStreak ?? 0,
              longestStreak: h.longestStreak ?? 0
            });
          }
        }
      } catch (err) {
        console.warn('[Dashboard] Could not load metrics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, [profile]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Student Dashboard
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Welcome back, {profile?.fullName || user?.username || 'Student'}!
          </h1>
          <p className="text-xs text-slate-300 font-normal">
            Track real-time sandbox executions and algorithmic speedup metrics.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Link
            to="/profile"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition flex items-center gap-1.5"
          >
            <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
            Profile
          </Link>
          <Link
            to="/problems"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
          >
            Solve Problems
            <ArrowRight className="w-3.5 h-3.5" />
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
            <span className="text-xs font-bold uppercase tracking-wider">Max Streak</span>
            <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">{stats.longestStreak} Days</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Personal consistency record</span>
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

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-xs">Loading submission history...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-12 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
            <Code2 className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Submissions Recorded Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't run any code submissions yet. Choose a problem from the catalog or formulate one with AI to get started.
            </p>
            <div className="pt-2">
              <Link
                to="/problems"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
              >
                Solve Your First Challenge
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => {
              const isAccepted = sub.verdict === 'ACCEPTED';
              const formattedDate = new Date(sub.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    {isAccepted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
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
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-right font-mono">
                    <div>
                      <span className="text-slate-900 dark:text-slate-100 font-bold block">
                        {sub.executionTimeMs != null ? `${sub.executionTimeMs}ms` : '--'}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {sub.memoryUsedKb != null ? `${Math.round(sub.memoryUsedKb / 1024)}MB` : '--'}
                      </span>
                    </div>
                    <div className="w-24">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] block ${
                          isAccepted
                            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60'
                            : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60'
                        }`}
                      >
                        {sub.verdict}
                      </span>
                      {sub.compositeScore != null && (
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] block mt-0.5">
                          Score: {sub.compositeScore}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
