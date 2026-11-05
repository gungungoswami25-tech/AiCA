import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Sparkles,
  ArrowLeftRight,
  ChevronLeft,
  ShieldCheck,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
  X,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { Problem, EvaluationReport, SolutionComparison, SupportedLanguage, LANGUAGE_CONFIGS } from '@aica/shared';
import { MonacoWorkspace } from '../components/MonacoWorkspace';
import { EvaluationReportView } from '../components/EvaluationReportView';
import { SolutionComparisonView } from '../components/SolutionComparisonView';
import { api } from '../services/api';

export function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLeftTab, setActiveLeftTab] = useState<'desc' | 'report' | 'compare' | 'submissions'>('desc');
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [comparison, setComparison] = useState<SolutionComparison | null>(null);
  const [pastSubmissions, setPastSubmissions] = useState<any[]>([]);
  const [loadingPastSubmissions, setLoadingPastSubmissions] = useState(false);
  const [inspectedCode, setInspectedCode] = useState<{ code: string; language: string; verdict: string; date: string } | null>(null);
  const [loadedCode, setLoadedCode] = useState<{ code: string; language: SupportedLanguage } | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [generatingComparison, setGeneratingComparison] = useState(false);

  const toggleCompareSelect = (subId: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(subId)) {
        return prev.filter((id) => id !== subId);
      }
      if (prev.length >= 2) {
        return [prev[1], subId];
      }
      return [...prev, subId];
    });
  };

  const handleGenerateComparison = async (idA?: string, idB?: string) => {
    const subA = idA || selectedForCompare[0];
    const subB = idB || selectedForCompare[1];
    if (!subA || !subB) return;
    setGeneratingComparison(true);
    try {
      const res = await api.post('/comparisons', { submissionIdA: subA, submissionIdB: subB });
      if (res.data?.data) {
        setComparison(res.data.data);
        setActiveLeftTab('compare');
        setSelectedForCompare([]);
      }
    } catch (err: any) {
      alert(`Comparison failed: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setGeneratingComparison(false);
    }
  };

  const handleLoadIntoEditor = (submission: { code: string; language: string }) => {
    if (!problem?.id) return;
    const lang = (submission.language || 'python') as SupportedLanguage;
    localStorage.setItem(`draft_${problem.id}_${lang}`, submission.code);
    setLoadedCode({ code: submission.code, language: lang });
    setInspectedCode(null);
  };

  useEffect(() => {
    if (id) {
      if (id === '1') {
        navigate('/workspace/two-sum-optimal', { replace: true });
        return;
      }
      localStorage.setItem('last_active_problem', id);
      fetchProblem(id);
    }
  }, [id, navigate]);

  const fetchProblem = async (problemId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/problems/${problemId}`);
      setProblem(res.data.data);
    } catch (err: any) {
      console.warn('[WorkspacePage] Problem fetch failed:', err.message);
      setProblem(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchProblemSubmissions = async () => {
    if (!problem?.id) return;
    setLoadingPastSubmissions(true);
    try {
      const res = await api.get(`/submissions/my?problemId=${problem.id}&limit=20`);
      setPastSubmissions(res.data?.data?.submissions || []);
    } catch (err: any) {
      console.warn('[WorkspacePage] Submissions fetch failed:', err.message);
    } finally {
      setLoadingPastSubmissions(false);
    }
  };

  const handleEvaluationComplete = async (reportId: string, submissionId: string) => {
    try {
      const res = await api.get(`/submissions/${submissionId}/report`);
      setReport(res.data.data);
      setActiveLeftTab('report');
      fetchProblemSubmissions();
    } catch (err: any) {
      console.warn('[WorkspacePage] Evaluation report deferred or not found:', err.message);
    }
  };

  const handleCompareClick = async () => {
    if (!problem?.id) return;
    setActiveLeftTab('compare');
    try {
      const res = await api.get(`/comparisons/problem/${problem.id}`);
      if (res.data?.data) {
        setComparison(res.data.data);
      }
    } catch {
      // Comparison not yet generated for this problem; user can select from submissions
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-mono">Loading coding workspace...</div>;
  }

  if (!problem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Problem Not Found</h2>
        <p className="text-sm text-slate-500 max-w-md">
          The requested problem challenge does not exist or has not yet been published to the catalog.
        </p>
        <Link
          to="/problems"
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
        >
          Return to Problem Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Workspace Subheader */}
      <div className="px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/problems"
            className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Problems
          </Link>
          <span className="text-slate-400 dark:text-slate-600">/</span>
          <h1 className="text-sm font-bold text-slate-900 dark:text-slate-200">{problem.title}</h1>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {problem.difficulty}
          </span>
        </div>

        {/* Tab Switcher for Left Panel */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveLeftTab('desc')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
              activeLeftTab === 'desc'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Description
          </button>
          <button
            onClick={() => setActiveLeftTab('report')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
              activeLeftTab === 'report'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Evaluation Report {report ? '✓' : ''}
          </button>
          <button
            onClick={() => {
              if (!comparison) handleCompareClick();
              setActiveLeftTab('compare');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
              activeLeftTab === 'compare'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Compare Solutions
          </button>
          <button
            onClick={() => {
              fetchProblemSubmissions();
              setActiveLeftTab('submissions');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
              activeLeftTab === 'submissions'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Submissions {pastSubmissions.length > 0 ? `(${pastSubmissions.length})` : ''}
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Canvas */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-hidden bg-slate-100/60 dark:bg-slate-950">
        {/* Left Pane (Description / Report / Comparison) */}
        <div className="h-full overflow-y-auto pr-2">
          {activeLeftTab === 'desc' && (
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-6 shadow-xs">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{problem.title}</h2>
                <div className="flex items-center gap-2 mt-2">
                  {problem.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="prose dark:prose-invert text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {problem.description}
              </div>

              {/* Examples */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Examples</h3>
                {problem.examples.map((ex, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-2">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-sans block mb-1">Input:</span>
                      <pre className="text-slate-800 dark:text-slate-200">{ex.input}</pre>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-sans block mb-1">Output:</span>
                      <pre className="text-emerald-600 dark:text-emerald-400">{ex.output}</pre>
                    </div>
                    {ex.explanation && (
                      <p className="text-slate-600 dark:text-slate-400 font-sans text-xs pt-1 border-t border-slate-200 dark:border-slate-800/80">
                        {ex.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Constraints */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Constraints</h3>
                <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                  {problem.constraints.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>

              {/* Benchmarks */}
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-300 space-y-1">
                <span className="font-semibold block text-indigo-700 dark:text-indigo-200">Execution Sandbox Limits:</span>
                <div>Time Limit: {problem.timeLimitMs}ms &bull; Memory Limit: {Math.round(problem.memoryLimitKb / 1024)}MB</div>
                <div>Optimal Benchmark Target: {problem.benchmarks?.targetTimeMs || 15}ms</div>
              </div>
            </div>
          )}

          {activeLeftTab === 'report' && (
            <div>
              {report ? (
                <EvaluationReportView
                  report={report}
                  onCompareRequest={handleCompareClick}
                  onReportUpdate={setReport}
                />
              ) : (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                  Submit code to generate an AI evaluation report and complexity profile.
                </div>
              )}
            </div>
          )}

          {activeLeftTab === 'compare' && (
            <div className="space-y-4">
              {comparison ? (
                <>
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
                    <span className="text-slate-600 dark:text-slate-400">Viewing comparative solution evolution</span>
                    {pastSubmissions.length >= 2 && (
                      <button
                        onClick={() => setComparison(null)}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                      >
                        Compare Different Submissions
                      </button>
                    )}
                  </div>
                  <SolutionComparisonView comparison={comparison} />
                </>
              ) : (
                <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      <ArrowLeftRight className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Evolutionary Solution Comparison
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Contrast two different approaches to explore runtime deltas, memory differences, and AI Big-O trade-offs.
                      </p>
                    </div>
                  </div>

                  {pastSubmissions.length >= 2 ? (
                    <div className="space-y-4 p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Select Two Submissions to Compare:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                        <div>
                          <span className="block text-slate-500 mb-1 font-sans font-semibold">Approach A (Baseline):</span>
                          <select
                            value={selectedForCompare[0] || pastSubmissions[pastSubmissions.length - 1]?.id || ''}
                            onChange={(e) => setSelectedForCompare([e.target.value, selectedForCompare[1] || pastSubmissions[0]?.id])}
                            className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                          >
                            {pastSubmissions.map((s, idx) => (
                              <option key={s.id} value={s.id}>
                                #{pastSubmissions.length - idx} &bull; {s.verdict} ({s.language}) - {s.executionTimeMs}ms
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <span className="block text-slate-500 mb-1 font-sans font-semibold">Approach B (Optimized / Variation):</span>
                          <select
                            value={selectedForCompare[1] || pastSubmissions[0]?.id || ''}
                            onChange={(e) => setSelectedForCompare([selectedForCompare[0] || pastSubmissions[pastSubmissions.length - 1]?.id, e.target.value])}
                            className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                          >
                            {pastSubmissions.map((s, idx) => (
                              <option key={s.id} value={s.id}>
                                #{pastSubmissions.length - idx} &bull; {s.verdict} ({s.language}) - {s.executionTimeMs}ms
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => {
                            const idA = selectedForCompare[0] || pastSubmissions[pastSubmissions.length - 1]?.id;
                            const idB = selectedForCompare[1] || pastSubmissions[0]?.id;
                            handleGenerateComparison(idA, idB);
                          }}
                          disabled={generatingComparison}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                        >
                          {generatingComparison ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          Generate AI Comparison & Diff
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-500 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <Clock className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        At least two submissions required
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Submit code with different algorithms (e.g. brute-force vs. two-pointer) to compare time/space trade-offs side by side.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeLeftTab === 'submissions' && (
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Your Problem Submissions</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Prior sandbox kernel test runs for this problem</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedForCompare.length === 2 && (
                    <button
                      onClick={() => handleGenerateComparison()}
                      disabled={generatingComparison}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      {generatingComparison ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowLeftRight className="w-3.5 h-3.5" />}
                      Compare Selected (2)
                    </button>
                  )}
                  {pastSubmissions.length >= 2 && selectedForCompare.length !== 2 && (
                    <button
                      onClick={() => handleGenerateComparison(pastSubmissions[pastSubmissions.length - 1].id, pastSubmissions[0].id)}
                      disabled={generatingComparison}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition cursor-pointer"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      Quick Compare
                    </button>
                  )}
                  <button
                    onClick={fetchProblemSubmissions}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer px-2 py-1"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {loadingPastSubmissions ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <p className="text-xs">Loading past submissions...</p>
                </div>
              ) : pastSubmissions.length === 0 ? (
                <div className="py-12 text-center text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <History className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs">No prior submissions recorded for this problem yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastSubmissions.map((sub) => {
                    const isAccepted = sub.verdict === 'ACCEPTED';
                    const isSelected = selectedForCompare.includes(sub.id);
                    return (
                      <div
                        key={sub.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition ${
                          isSelected
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isAccepted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          )}
                          <div>
                            <div className="font-bold font-mono text-slate-800 dark:text-slate-200">
                              {sub.verdict}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span className="uppercase font-semibold">{sub.language}</span>
                              <span>&bull;</span>
                              <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="text-right font-mono mr-2">
                            <span className="block font-semibold text-slate-800 dark:text-slate-200">
                              {sub.executionTimeMs != null ? `${sub.executionTimeMs}ms` : '--'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {sub.memoryUsedKb != null ? `${Math.round(sub.memoryUsedKb / 1024)}MB` : '--'}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleCompareSelect(sub.id)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected ? '✓ Selected' : 'Compare'}
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const fullRes = await api.get(`/submissions/${sub.id}`);
                                setInspectedCode({
                                  code: fullRes.data.data.code,
                                  language: sub.language,
                                  verdict: sub.verdict,
                                  date: new Date(sub.createdAt).toLocaleString()
                                });
                              } catch {
                                // fallback
                              }
                            }}
                            className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 font-semibold text-[11px] transition cursor-pointer"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Pane (Monaco Editor Workspace) */}
        <div className="h-full">
          <MonacoWorkspace
            problem={problem}
            onEvaluationComplete={handleEvaluationComplete}
            loadedCode={loadedCode}
          />
        </div>
      </div>

      {/* Code Snapshot Modal */}
      {inspectedCode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Submitted Code Snapshot ({inspectedCode.language})
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {inspectedCode.verdict}
                </span>
              </div>
              <button
                onClick={() => setInspectedCode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs">
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 whitespace-pre-wrap overflow-x-auto">
                {inspectedCode.code}
              </pre>
            </div>
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
              <span>Submitted: {inspectedCode.date}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLoadIntoEditor(inspectedCode)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer transition flex items-center gap-1.5 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Load into Editor
                </button>
                <button
                  onClick={() => setInspectedCode(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
