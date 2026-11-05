import {
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Sparkles,
  Zap,
  HelpCircle,
  Code,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { EvaluationReport, Submission } from '@aica/shared';

interface EvaluationReportViewProps {
  report: EvaluationReport;
  submission?: Submission;
  onCompareRequest?: () => void;
}

export function EvaluationReportView({ report, submission, onCompareRequest }: EvaluationReportViewProps) {
  const isAccepted = report.verdict === 'ACCEPTED';
  const ai = report.aiAnalysis;

  return (
    <div className="space-y-6">
      {/* Top Verdict Banner */}
      <div
        className={`p-6 rounded-2xl border flex items-center justify-between ${
          isAccepted
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isAccepted ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}
          >
            {isAccepted ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">{report.verdict}</h2>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                Score: {report.metrics?.compositeScore || 0.0} / 100
              </span>
            </div>
            <p className="text-sm opacity-80 mt-1">{report.summary}</p>
          </div>
        </div>

        {onCompareRequest && isAccepted && (
          <button
            onClick={onCompareRequest}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            Compare Solution
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
            <Clock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            Execution Time
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {report.metrics?.rawTimeMs} <span className="text-xs text-slate-400 dark:text-slate-500 font-sans">ms</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Norm: {report.metrics?.normalizedTimeMs}ms</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
            <Cpu className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            Memory Usage
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {Math.round((report.metrics?.rawMemoryKb || 0) / 1024)}{' '}
            <span className="text-xs text-slate-400 dark:text-slate-500 font-sans">MB</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{report.metrics?.rawMemoryKb} KB</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            Theoretical Time
          </span>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-300">
            {ai?.theoreticalComplexity?.timeComplexity || 'O(N)'}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Asymptotic Big-O</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
            <Zap className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            Code Quality
          </span>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-300">
            {ai?.codeQuality?.score || 8.0} <span className="text-xs text-slate-400 dark:text-slate-500 font-sans">/ 10</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Static Readability</span>
        </div>
      </div>

      {/* AI Pedagogical Analysis Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">AI Code Evolution & Complexity Insights</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Evaluated via Google Gemini 1.5 &bull; {ai?.mode === 'OPTIMIZATION' ? 'Optimization Mode' : 'Diagnostic Mode'}
            </span>
          </div>
        </div>

        {/* Complexity Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">Time & Space Asymptotics</span>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {ai?.theoreticalComplexity?.explanation || 'Linear single-pass lookup with auxiliary cache.'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">Readability & Maintainability</span>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {ai?.codeQuality?.readabilityAnalysis || 'Clean modular function decomposition with clear variable semantics.'}
            </p>
          </div>
        </div>

        {/* Mode B: Diagnostic Feedback (if failed) */}
        {ai?.diagnosticFeedback && (
          <div className="p-5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 space-y-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              Algorithmic Diagnostic & Edge-Case Trap
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong className="text-amber-800 dark:text-amber-200">Root Cause:</strong> {ai.diagnosticFeedback.rootCauseBug}
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong className="text-amber-800 dark:text-amber-200">Vulnerability:</strong> {ai.diagnosticFeedback.edgeCaseVulnerability}
            </p>
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>Socratic Hint:</strong> {ai.diagnosticFeedback.socraticHint}
              </span>
            </div>
          </div>
        )}

        {/* Mode A: Optimization Suggestions */}
        {ai?.optimizationSuggestions && ai.optimizationSuggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Evolutionary Refactoring Vectors</h4>
            <div className="space-y-3">
              {ai.optimizationSuggestions.map((opt, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">{opt.title}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                      {opt.expectedTimeImpact}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{opt.rationale}</p>
                  {opt.refactoredSnippet && (
                    <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono overflow-x-auto">
                      {opt.refactoredSnippet}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Test Cases Pass/Fail Matrix */}
      {submission?.testResults && submission.testResults.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">Test Execution Breakdown</h3>
          <div className="space-y-2">
            {submission.testResults.map((tr) => (
              <div
                key={tr.testCaseId || tr.index}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  {tr.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  )}
                  <span className="text-slate-800 dark:text-slate-300 font-semibold">
                    Test #{tr.index} {tr.isPublic ? '(Public)' : '(Hidden Edge Case)'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                  <span>{tr.executionTimeMs} ms</span>
                  <span>{tr.memoryKb} KB</span>
                  <span className={tr.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                    {tr.passed ? 'PASSED' : tr.errorMessage || 'FAILED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
