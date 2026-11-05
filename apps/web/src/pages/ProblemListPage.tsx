import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, ArrowRight, Tag, Sparkles } from 'lucide-react';
import { ProblemListItem, ProblemDifficulty } from '@aica/shared';
import { api } from '../services/api';

export function ProblemListPage() {
  const [problems, setProblems] = useState<ProblemListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<string>('ALL');

  useEffect(() => {
    fetchProblems();
  }, [difficulty]);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (difficulty !== 'ALL') params.difficulty = difficulty;
      if (search) params.search = search;

      const res = await api.get('/problems', { params });
      setProblems(res.data.data.problems || []);
    } catch {
      // Fallback sample data if backend DB is not yet populated
      setProblems([
        {
          id: 'two-sum-optimal',
          title: 'Two Sum Optimal',
          slug: 'two-sum-optimal',
          difficulty: 'EASY',
          tags: ['Arrays', 'Hash-Table'],
          totalSubmissions: 48,
          acceptanceRate: 75.0
        },
        {
          id: 'longest-substring',
          title: 'Longest Substring Without Repeating Characters',
          slug: 'longest-substring-without-repeating',
          difficulty: 'MEDIUM',
          tags: ['Strings', 'Sliding-Window', 'Hash-Table'],
          totalSubmissions: 32,
          acceptanceRate: 56.2
        },
        {
          id: 'container-water',
          title: 'Container With Most Water',
          slug: 'container-with-most-water',
          difficulty: 'MEDIUM',
          tags: ['Arrays', 'Two-Pointers', 'Greedy'],
          totalSubmissions: 24,
          acceptanceRate: 62.5
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadge = (diff: ProblemDifficulty) => {
    switch (diff) {
      case 'EASY':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Easy</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Medium</span>;
      case 'HARD':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">Hard</span>;
    }
  };

  const filtered = problems.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
            Problem Catalog
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Solve algorithmic problems with multi-language runtimes, isolated Judge0 sandboxes, and AI complexity evaluation.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          {['ALL', 'EASY', 'MEDIUM', 'HARD'].map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                difficulty === d
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search problems by title or algorithm tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-xs transition"
        />
      </div>

      {/* Problem Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-mono">Loading problem repository...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">No problems found matching your criteria.</div>
        ) : (
          filtered.map((prob) => (
            <Link
              key={prob.id}
              to={`/workspace/${prob.id}`}
              className="group p-5 rounded-2xl bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between transition shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-base text-slate-900 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {prob.title}
                  </span>
                  {getDifficultyBadge(prob.difficulty)}
                </div>

                <div className="flex items-center gap-2">
                  {prob.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 font-mono">
                    Acceptance: {prob.acceptanceRate}% ({prob.totalSubmissions} submissions)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition">
                Solve Problem
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
