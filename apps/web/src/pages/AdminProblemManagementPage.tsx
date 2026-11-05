import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Archive,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Tag,
  Clock,
  Cpu,
  Layers,
  Sparkles,
  AlertCircle,
  X,
  Loader2,
  RotateCcw,
  Check
} from 'lucide-react';
import { Problem, ProblemDifficulty, ProblemLifecycleStatus, TestCase } from '@aica/shared';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

interface AdminProblemItem {
  id: string;
  title: string;
  slug: string;
  difficulty: ProblemDifficulty;
  status: ProblemLifecycleStatus;
  tags: string[];
  totalSubmissions: number;
  acceptedSubmissions: number;
  createdAt: string;
  updatedAt: string;
}

interface ProblemFormData {
  title: string;
  slug: string;
  difficulty: ProblemDifficulty;
  status: ProblemLifecycleStatus;
  tags: string;
  description: string;
  constraints: string;
  timeLimitMs: number;
  memoryLimitKb: number;
  starterPython: string;
  starterJs: string;
  starterCpp: string;
  starterJava: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  testCases: Array<{
    id?: string;
    input: string;
    expectedOutput: string;
    isPublic: boolean;
    explanation?: string;
  }>;
}

const DEFAULT_FORM_DATA: ProblemFormData = {
  title: '',
  slug: '',
  difficulty: 'EASY',
  status: 'UNPUBLISHED',
  tags: 'Arrays, Algorithms',
  description: '',
  constraints: '1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9',
  timeLimitMs: 2000,
  memoryLimitKb: 262144,
  starterPython: 'def solve():\n    pass\n',
  starterJs: 'function solve() {\n}\n',
  starterCpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n',
  starterJava: 'class Solution {\n    public void solve() {\n    }\n}\n',
  examples: [
    { input: '[2, 7, 11, 15], target = 9', output: '[0, 1]', explanation: 'nums[0] + nums[1] == 9' }
  ],
  testCases: [
    { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isPublic: true, explanation: 'Sample public case' },
    { input: '2\n3 3\n6', expectedOutput: '0 1', isPublic: false, explanation: 'Hidden edge case' }
  ]
};

export function AdminProblemManagementPage() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [problems, setProblems] = useState<AdminProblemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProblemFormData>(DEFAULT_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Staff Authorization Check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/admin/problems');
      return;
    }
    const role = (user as any)?.role;
    if (role !== 'ADMIN' && role !== 'INSTRUCTOR') {
      navigate('/problems');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    fetchAdminProblems();
  }, [statusFilter]);

  const fetchAdminProblems = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const res = await api.get('/problems/admin/all', { params });
      setProblems(res.data.data.problems || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load admin problems list');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProblemId(null);
    setFormData(DEFAULT_FORM_DATA);
    setModalError(null);
    setModalSuccess(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (problemId: string) => {
    setEditingProblemId(problemId);
    setModalError(null);
    setModalSuccess(null);
    try {
      const res = await api.get(`/problems/admin/${problemId}`);
      const p: Problem = res.data.data;
      setFormData({
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        status: p.status,
        tags: (p.tags || []).join(', '),
        description: p.description,
        constraints: (p.constraints || []).join('\n'),
        timeLimitMs: p.timeLimitMs || 2000,
        memoryLimitKb: p.memoryLimitKb || 262144,
        starterPython: p.starterCode?.python || '',
        starterJs: p.starterCode?.javascript || '',
        starterCpp: p.starterCode?.cpp || '',
        starterJava: p.starterCode?.java || '',
        examples: p.examples?.length ? p.examples : [{ input: '', output: '' }],
        testCases: (p.testCases || []).map((tc) => ({
          id: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isPublic: tc.isPublic,
          explanation: tc.explanation
        }))
      });
      setIsModalOpen(true);
    } catch (err: any) {
      alert(`Failed to load full problem: ${err.message}`);
    }
  };

  const handleArchiveProblem = async (problemId: string, title: string) => {
    if (!confirm(`Are you sure you want to archive "${title}"? This soft-deletes the problem while preserving historical submissions.`)) {
      return;
    }
    try {
      await api.delete(`/problems/${problemId}`);
      fetchAdminProblems();
    } catch (err: any) {
      alert(`Archive failed: ${err.response?.data?.error?.message || err.message}`);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    // Client-side validations
    const tagsArray = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (tagsArray.length === 0) {
      setModalError('At least one algorithm tag is required (e.g. Arrays).');
      setIsSubmitting(false);
      return;
    }

    const constraintsArray = formData.constraints
      .split('\n')
      .map((c) => c.trim())
      .filter(Boolean);

    // Backend pre-publish validation check:
    if (formData.status === 'PUBLISHED') {
      const hasPublic = formData.testCases.some((tc) => tc.isPublic);
      const hasHidden = formData.testCases.some((tc) => !tc.isPublic);
      if (!hasPublic || !hasHidden) {
        setModalError('Cannot publish problem: at least 1 public test case and 1 hidden testcase are required before publishing.');
        setIsSubmitting(false);
        return;
      }
    }

    const payload = {
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      difficulty: formData.difficulty,
      status: formData.status,
      tags: tagsArray,
      description: formData.description.trim(),
      constraints: constraintsArray,
      examples: formData.examples.filter((ex) => ex.input.trim() && ex.output.trim()),
      timeLimitMs: Number(formData.timeLimitMs),
      memoryLimitKb: Number(formData.memoryLimitKb),
      starterCode: {
        python: formData.starterPython,
        javascript: formData.starterJs,
        cpp: formData.starterCpp,
        java: formData.starterJava
      },
      testCases: formData.testCases.filter((tc) => tc.input.trim() && tc.expectedOutput.trim())
    };

    try {
      if (editingProblemId) {
        await api.put(`/problems/${editingProblemId}`, payload);
        setModalSuccess('Problem updated successfully!');
      } else {
        await api.post('/problems', payload);
        setModalSuccess('Problem created successfully!');
      }

      setTimeout(() => {
        setIsModalOpen(false);
        fetchAdminProblems();
      }, 1000);
    } catch (err: any) {
      setModalError(err.response?.data?.error?.message || 'Failed to save problem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const autoGenerateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setFormData((prev) => ({ ...prev, slug }));
  };

  // Filtered problems list
  const filteredProblems = problems.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              Problem Catalog Manager
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Staff Only
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Author, edit, test, and publish official curriculum problems with public and hidden test-case suites.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/proposals"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition"
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            AI Proposal Review
          </Link>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Problem
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search problems by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Problems Management Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500 mx-auto" />
            <p className="text-xs font-mono text-slate-400">Loading problem records...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No problems found</p>
            <p className="text-xs text-slate-400">Click &quot;New Problem&quot; to author your first curriculum challenge.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-5 py-3.5">Title &amp; Slug</th>
                  <th className="px-4 py-3.5">Difficulty</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Tags</th>
                  <th className="px-4 py-3.5">Submissions</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {filteredProblems.map((prob) => (
                  <tr key={prob.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {prob.title}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                        /{prob.slug}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        prob.difficulty === 'EASY'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-500/20'
                          : prob.difficulty === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-500/20'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-500/20'
                      }`}>
                        {prob.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
                        prob.status === 'PUBLISHED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : prob.status === 'ARCHIVED'
                          ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}>
                        {prob.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {prob.tags.slice(0, 3).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-slate-500">
                      {prob.totalSubmissions}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/workspace/${prob.slug || prob.id}`}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                          title="Preview in Student Workspace"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleOpenEditModal(prob.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-600 dark:text-purple-400 transition cursor-pointer"
                          title="Edit Problem & Test Cases"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {prob.status !== 'ARCHIVED' && (
                          <button
                            onClick={() => handleArchiveProblem(prob.id, prob.title)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition cursor-pointer"
                            title="Archive Problem (Soft-delete)"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Problem Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {editingProblemId ? 'Edit Curriculum Problem' : 'Create New Curriculum Problem'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              {/* Basic Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Problem Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Reverse Linked List"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">URL Slug *</label>
                    <button
                      type="button"
                      onClick={autoGenerateSlug}
                      className="text-[10px] text-purple-600 hover:underline cursor-pointer"
                    >
                      Auto-generate from title
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. reverse-linked-list"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Difficulty & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Difficulty *</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as ProblemDifficulty })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Catalog Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProblemLifecycleStatus })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="UNPUBLISHED">Unpublished (Draft / Internal)</option>
                    <option value="PUBLISHED">Published (Live in Student Catalog)</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Topic Tags (comma-separated) *</label>
                  <input
                    type="text"
                    required
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Arrays, Hash-Table, Two-Pointers"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Problem Description (Markdown supported) *</label>
                <textarea
                  required
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="State the algorithmic problem clearly with parameters, expected return values, and behavior..."
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-sans"
                />
              </div>

              {/* Constraints */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Constraints (one per line)</label>
                <textarea
                  rows={3}
                  value={formData.constraints}
                  onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                  placeholder="1 <= nums.length <= 10^5&#10;-10^9 <= target <= 10^9"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Sandbox Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Execution Time Limit (ms)</label>
                  <input
                    type="number"
                    min={100}
                    max={10000}
                    value={formData.timeLimitMs}
                    onChange={(e) => setFormData({ ...formData, timeLimitMs: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Memory Limit (KB)</label>
                  <input
                    type="number"
                    min={16384}
                    max={524288}
                    value={formData.memoryLimitKb}
                    onChange={(e) => setFormData({ ...formData, memoryLimitKb: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Test Cases Manager (Public & Hidden) */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">Test Cases Suite</h4>
                    <p className="text-[11px] text-slate-500">
                      Minimum 1 public case and 1 hidden case required before publishing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        testCases: [
                          ...prev.testCases,
                          { input: '', expectedOutput: '', isPublic: false, explanation: '' }
                        ]
                      }))
                    }
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Test Case
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.testCases.map((tc, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
                            Case #{idx + 1}
                          </span>
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
                            <input
                              type="checkbox"
                              checked={tc.isPublic}
                              onChange={(e) => {
                                const updated = [...formData.testCases];
                                updated[idx].isPublic = e.target.checked;
                                setFormData({ ...formData, testCases: updated });
                              }}
                              className="rounded text-purple-600 focus:ring-purple-500"
                            />
                            <span>{tc.isPublic ? 'Public Case' : 'Hidden Case (Strict Evaluation)'}</span>
                          </label>
                        </div>
                        {formData.testCases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.testCases.filter((_, i) => i !== idx);
                              setFormData({ ...formData, testCases: updated });
                            }}
                            className="text-rose-500 hover:text-rose-600 font-semibold text-[11px] cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-[11px] text-slate-500 font-medium block mb-1">stdin Input:</span>
                          <textarea
                            rows={2}
                            value={tc.input}
                            onChange={(e) => {
                              const updated = [...formData.testCases];
                              updated[idx].input = e.target.value;
                              setFormData({ ...formData, testCases: updated });
                            }}
                            placeholder="Input stream..."
                            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px]"
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 font-medium block mb-1">Expected stdout Output:</span>
                          <textarea
                            rows={2}
                            value={tc.expectedOutput}
                            onChange={(e) => {
                              const updated = [...formData.testCases];
                              updated[idx].expectedOutput = e.target.value;
                              setFormData({ ...formData, testCases: updated });
                            }}
                            placeholder="Exact expected stdout..."
                            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer disabled:opacity-50 shadow-md shadow-purple-600/30"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingProblemId ? 'Save Changes' : 'Create Problem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
