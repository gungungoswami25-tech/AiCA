import { useState } from 'react';
import {
  Sparkles,
  Clock,
  Cpu,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Info,
  TrendingUp,
  Award,
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { MultiSolutionComparison, MultiSolutionItem } from '@aica/shared';

interface MultiSolutionComparisonViewProps {
  comparison: MultiSolutionComparison;
  onSelectSolutionForEditor?: (code: string, language: string) => void;
}

export function MultiSolutionComparisonView({
  comparison,
  onSelectSolutionForEditor
}: MultiSolutionComparisonViewProps) {
  const { problemTitle, solutions, matrixComparison } = comparison;
  const [activeCodeTab, setActiveCodeTab] = useState<number>(0);

  const fastestId = matrixComparison?.empiricalAnalysis?.fastestSubmissionId;
  const lowestMemId = matrixComparison?.empiricalAnalysis?.lowestMemorySubmissionId;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Layers className="w-3.5 h-3.5" />
              Collaborative Evolution Arena
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Multi-Solution Comparative Matrix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Benchmarking {solutions.length} distinct student solutions for{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                "{problemTitle}"
              </span>
              . Contrasting algorithmic paradigm, asymptotic complexity, and sandbox performance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              {solutions.length} Versions Analyzed
            </span>
          </div>
        </div>

        {/* Empirical Range Overview */}
        {matrixComparison?.empiricalAnalysis && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/60">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                Sandbox Runtime Range
              </span>
              <span className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {matrixComparison.empiricalAnalysis.runtimeRangeMs}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/60">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                Memory Footprint Range
              </span>
              <span className="text-sm font-bold font-mono text-purple-600 dark:text-purple-400">
                {matrixComparison.empiricalAnalysis.memoryRangeKb}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/60">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                Fastest Algorithm
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                {solutions.find((s) => s.submissionId === fastestId)?.algorithmName || 'Quick Sort'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/60">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                Lowest Space
              </span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5" />
                {solutions.find((s) => s.submissionId === lowestMemId)?.algorithmName || 'Bubble Sort'} (O(1))
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Controlled Sandbox Notice */}
      <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 text-xs text-indigo-800 dark:text-indigo-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-semibold">Theoretical vs. Empirical Note:</strong> Asymptotic Big-O
          time and space complexity are mathematical bounds. The execution time and memory usage shown
          below were measured separately using our isolated, controlled Linux sandbox execution
          environment.
        </p>
      </div>

      {/* Comparative Matrix Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Algorithm Comparison Matrix
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            N = 10,000 Scaling Profile
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Student & Version</th>
                <th className="py-3 px-4">Algorithm</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Theoretical Time</th>
                <th className="py-3 px-4">Theoretical Space</th>
                <th className="py-3 px-4">Measured Runtime</th>
                <th className="py-3 px-4">Quality Score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {solutions.map((sol, idx) => {
                const isFastest = sol.submissionId === fastestId;
                const isLowestMem = sol.submissionId === lowestMemId;

                return (
                  <tr
                    key={sol.submissionId}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold font-mono text-xs">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">
                            {sol.username}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {sol.versionLabel || `Version ${idx + 1}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {sol.algorithmName}
                        </span>
                        {isFastest && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            ⚡ Fastest
                          </span>
                        )}
                        {isLowestMem && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            🧠 O(1) Space
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        {sol.verdict}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span
                        className={
                          sol.timeComplexity.includes('N^2')
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-indigo-600 dark:text-indigo-400'
                        }
                      >
                        {sol.timeComplexity}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {sol.spaceComplexity}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {sol.executionTimeMs} ms
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {Math.round(sol.memoryUsedKb / 1024)} MB
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {sol.qualityScore}
                        </span>
                        <span className="text-[10px] text-slate-400">/ 10</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setActiveCodeTab(idx)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition cursor-pointer"
                      >
                        Inspect Code
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Algorithm Pedagogical Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {solutions.map((sol, idx) => (
          <div
            key={sol.submissionId}
            className={`p-5 rounded-2xl border transition ${
              activeCodeTab === idx
                ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono flex items-center justify-center">
                  #{idx + 1}
                </span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {sol.algorithmName}
                </h4>
              </div>
              <span className="text-[11px] font-mono text-slate-400">{sol.username}</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <div>
                <strong className="text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider mb-0.5">
                  Algorithmic Trade-off
                </strong>
                <p className="leading-relaxed">
                  Time: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{sol.timeComplexity}</span> | Space: <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{sol.spaceComplexity}</span>
                </p>
              </div>

              {sol.keyStrengths && sol.keyStrengths.length > 0 && (
                <div>
                  <strong className="text-emerald-700 dark:text-emerald-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Strengths
                  </strong>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {sol.keyStrengths.map((str, sIdx) => (
                      <li key={sIdx}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}

              {sol.weaknessesOrBottlenecks && sol.weaknessesOrBottlenecks.length > 0 && (
                <div>
                  <strong className="text-amber-700 dark:text-amber-400 block text-[11px] uppercase tracking-wider mb-0.5">
                    Bottlenecks & Traps
                  </strong>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {sol.weaknessesOrBottlenecks.map((wb, wIdx) => (
                      <li key={wIdx}>{wb}</li>
                    ))}
                  </ul>
                </div>
              )}

              {sol.optimizationNotes && (
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-[11px]">
                  <strong className="text-indigo-600 dark:text-indigo-400 block mb-0.5">
                    Optimization Opportunity
                  </strong>
                  {sol.optimizationNotes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Code Viewer Tabs */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-500" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Inspect Implementation Code
            </h4>
          </div>

          <div className="flex items-center gap-1.5">
            {solutions.map((sol, idx) => (
              <button
                key={sol.submissionId}
                onClick={() => setActiveCodeTab(idx)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeCodeTab === idx
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                }`}
              >
                {sol.algorithmName} ({sol.username})
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 font-mono text-xs overflow-x-auto bg-slate-950 text-slate-200 max-h-[350px]">
          <pre>{solutions[activeCodeTab]?.code}</pre>
        </div>
      </div>

      {/* AI Evolutionary Synthesis & Pedagogical Takeaway */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          AI Evolutionary Synthesis & Performance Scaling Analysis
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-line">
          {matrixComparison?.evolutionarySynthesis}
        </p>

        {matrixComparison?.pedagogicalTakeaway && (
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 flex items-start gap-3">
            <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-0.5">
                Key Pedagogical Takeaway
              </h5>
              <p className="text-xs text-indigo-800/90 dark:text-indigo-300/90 leading-relaxed font-sans">
                {matrixComparison.pedagogicalTakeaway}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
