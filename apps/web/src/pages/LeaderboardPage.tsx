import { useState, useEffect } from 'react';
import { Trophy, ShieldCheck } from 'lucide-react';
import { LeaderboardEntry } from '@aica/shared';
import { LeaderboardView } from '../components/LeaderboardView';
import { api } from '../services/api';

export function LeaderboardPage() {
  const [selectedProblem, setSelectedProblem] = useState('two-sum-optimal');
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard(selectedProblem);
  }, [selectedProblem]);

  const fetchLeaderboard = async (probId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/leaderboards/problem/${probId}`);
      setRankings(res.data.data.rankings || []);
    } catch {
      // Fallback sample rankings if backend is not yet populated
      setRankings([
        {
          rank: 1,
          userId: 'u1',
          username: 'algo_queen',
          submissionId: 'sub-1',
          language: 'cpp',
          compositeScore: 97.4,
          breakdown: {
            rawTimeMs: 12,
            normalizedTimeMs: 12.0,
            timeScore: 98.5,
            rawMemoryKb: 4096,
            normalizedMemoryKb: 2048,
            memoryScore: 97.0,
            qualityScore: 9.5,
            qualityPoints: 95.0,
            formula: '0.50*St + 0.30*Sm + 0.20*Sq'
          },
          submittedAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          rank: 2,
          userId: 'u2',
          username: 'pythonista_pro',
          submissionId: 'sub-2',
          language: 'python',
          compositeScore: 94.6,
          breakdown: {
            rawTimeMs: 38,
            normalizedTimeMs: 9.5,
            timeScore: 96.0,
            rawMemoryKb: 14200,
            normalizedMemoryKb: 2048,
            memoryScore: 94.0,
            qualityScore: 9.0,
            qualityPoints: 90.0,
            formula: '0.50*St + 0.30*Sm + 0.20*Sq'
          },
          submittedAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          rank: 3,
          userId: 'u3',
          username: 'node_ninja',
          submissionId: 'sub-3',
          language: 'javascript',
          compositeScore: 91.2,
          breakdown: {
            rawTimeMs: 45,
            normalizedTimeMs: 18.0,
            timeScore: 92.0,
            rawMemoryKb: 22000,
            normalizedMemoryKb: 2048,
            memoryScore: 90.0,
            qualityScore: 9.0,
            qualityPoints: 90.0,
            formula: '0.50*St + 0.30*Sm + 0.20*Sq'
          },
          submittedAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            Platform Leaderboards
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Transparent composite scoring based on execution runtime, auxiliary memory, and AI code quality.
          </p>
        </div>

        <div>
          <select
            value={selectedProblem}
            onChange={(e) => setSelectedProblem(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="two-sum-optimal">Two Sum Optimal</option>
            <option value="longest-substring">Longest Substring Without Repeating</option>
            <option value="container-water">Container With Most Water</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono">Loading rankings...</div>
      ) : (
        <LeaderboardView
          rankings={rankings}
          problemTitle={
            selectedProblem === 'two-sum-optimal'
              ? 'Two Sum Optimal'
              : selectedProblem === 'longest-substring'
              ? 'Longest Substring Without Repeating Characters'
              : 'Container With Most Water'
          }
        />
      )}
    </div>
  );
}
