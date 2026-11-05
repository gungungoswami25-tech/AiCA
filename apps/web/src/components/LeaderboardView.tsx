import { useState } from 'react';
import { Trophy, Clock, Cpu, Zap, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { LeaderboardEntry } from '@aica/shared';

interface LeaderboardViewProps {
  rankings: LeaderboardEntry[];
  problemTitle?: string;
}

export function LeaderboardView({ rankings, problemTitle }: LeaderboardViewProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (subId: string) => {
    setExpandedRow(expandedRow === subId ? null : subId);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">🥇</span>;
    if (rank === 2) return <span className="w-6 h-6 rounded-full bg-slate-300/20 text-slate-300 font-bold flex items-center justify-center text-xs">🥈</span>;
    if (rank === 3) return <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 font-bold flex items-center justify-center text-xs">🥉</span>;
    return <span className="w-6 h-6 text-slate-500 font-mono text-xs flex items-center justify-center">#{rank}</span>;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-md dark:shadow-2xl">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {problemTitle ? `${problemTitle} — Official Leaderboard` : 'Problem Leaderboard'}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Transparent composite score &bull; Language-normalized
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
                <ShieldCheck className="w-3 h-3" /> Correctness Gated (100% Passed)
              </span>
            </div>
          </div>
        </div>
      </div>

      {rankings.length === 0 ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
          No accepted submissions yet. Be the first to solve this problem and claim #1 on the leaderboard!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4 font-sans font-semibold">Student / Handle</th>
                <th className="py-3 px-4 font-sans font-semibold">Language</th>
                <th className="py-3 px-4 font-sans font-semibold">Runtime</th>
                <th className="py-3 px-4 font-sans font-semibold">Memory</th>
                <th className="py-3 px-4 font-sans font-semibold">AI Quality</th>
                <th className="py-3 px-4 font-sans font-semibold text-right">Composite Score</th>
                <th className="py-3 px-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {rankings.map((entry) => {
                const isExpanded = expandedRow === entry.submissionId;
                return (
                  <tr key={entry.submissionId} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 text-center">{getRankBadge(entry.rank)}</td>
                    <td className="py-3.5 px-4 font-sans font-semibold text-slate-900 dark:text-slate-200">
                      {entry.username}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-300 text-[11px]">
                        {entry.language}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{entry.breakdown?.rawTimeMs}ms</td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {Math.round((entry.breakdown?.rawMemoryKb || 0) / 1024)}MB
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400">
                      {entry.breakdown?.qualityScore}/10
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                        {entry.compositeScore}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleRow(entry.submissionId)}
                        className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition"
                        title="View Score Breakdown"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
