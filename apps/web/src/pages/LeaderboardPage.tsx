import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { LeaderboardEntry } from '@aica/shared';
import { LeaderboardView } from '../components/LeaderboardView';
import { api } from '../services/api';

export function LeaderboardPage() {
  const [problems, setProblems] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedProblem, setSelectedProblem] = useState<string>('');
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch published problems list on mount
  useEffect(() => {
    const loadProblems = async () => {
      try {
        const res = await api.get('/problems');
        const list = res.data?.data?.problems || [];
        if (list.length > 0) {
          setProblems(list);
          setSelectedProblem(list[0].id);
        }
      } catch (err: any) {
        console.warn('[LeaderboardPage] Failed to fetch catalog:', err.message);
      }
    };
    loadProblems();
  }, []);

  useEffect(() => {
    if (selectedProblem) {
      fetchLeaderboard(selectedProblem);
    }
  }, [selectedProblem]);

  const fetchLeaderboard = async (probId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/leaderboards/problem/${probId}`);
      setRankings(res.data.data.rankings || []);
    } catch (err: any) {
      console.warn('[LeaderboardPage] Failed to fetch rankings:', err.message);
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  const currentProblemTitle =
    problems.find((p) => p.id === selectedProblem)?.title || 'Problem Leaderboard';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500 dark:text-amber-400" />
            Platform Leaderboards
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Transparent composite scoring based on execution runtime, auxiliary memory, and AI code quality.
          </p>
        </div>

        {problems.length > 0 && (
          <div>
            <select
              value={selectedProblem}
              onChange={(e) => setSelectedProblem(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 font-medium shadow-xs"
            >
              {problems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-mono">Loading rankings...</div>
      ) : rankings.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Ranked Submissions Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Be the first student to solve {currentProblemTitle} with an accepted solution and claim the #1 spot on the leaderboard!
          </p>
        </div>
      ) : (
        <LeaderboardView rankings={rankings} problemTitle={currentProblemTitle} />
      )}
    </div>
  );
}
