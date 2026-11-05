import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  Sparkles,
  Zap,
  BarChart3,
  Layers,
  ChevronRight,
  CheckCircle2,
  Clock,
  HardDrive,
  GitCompare,
  Code2,
  ExternalLink
} from 'lucide-react';

interface CodeSample {
  title: string;
  complexity: string;
  runtimeMs: number;
  memoryMb: number;
  verdict: string;
  verdictColor: string;
  code: string;
  aiExplanation: string;
}

const SAMPLE_COMPARISONS: Record<string, CodeSample[]> = {
  python: [
    {
      title: 'Naive Brute-Force Approach',
      complexity: 'O(N²) Time • O(1) Space',
      runtimeMs: 1420,
      memoryMb: 14.1,
      verdict: 'TLE Warning (Time Limit Exceeded risk)',
      verdictColor: 'text-amber-700 bg-amber-50 border-amber-200',
      code: `def twoSum(nums: list[int], target: int) -> list[int]:
    n = len(nums)
    # Quadratic nested loop: checks all pairs
    for i in range(n):
        for j in range(i + 1, n):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []`,
      aiExplanation:
        'Quadratic iteration over all pairs causes quadratic growth (O(N²)). When input length N=10⁴, operations approach 10⁸, breaching the 2000ms sandbox time limit.'
    },
    {
      title: 'Optimal Hash Map Approach',
      complexity: 'O(N) Time • O(N) Space',
      runtimeMs: 18,
      memoryMb: 15.3,
      verdict: 'Accepted (100% Tests Passed)',
      verdictColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      code: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {} # Value -> Index hash map
    # Single linear scan with O(1) average lookup
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
      aiExplanation:
        'Single-pass hash table reduces runtime by 98.7% (18ms vs 1420ms). Algorithmic trade-off: Allocates +1.2 MB auxiliary heap space to achieve linear O(N) execution.'
    }
  ],
  javascript: [
    {
      title: 'Naive Brute-Force Approach',
      complexity: 'O(N²) Time • O(1) Space',
      runtimeMs: 980,
      memoryMb: 36.2,
      verdict: 'Inefficient (High Latency)',
      verdictColor: 'text-amber-700 bg-amber-50 border-amber-200',
      code: `function twoSum(nums, target) {
  // Nested iteration across array
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}`,
      aiExplanation:
        'Double loop causes JavaScript V8 engine to repeatedly de-optimize inner iteration frames. High latency under large arrays.'
    },
    {
      title: 'Optimal Map Lookup',
      complexity: 'O(N) Time • O(N) Space',
      runtimeMs: 14,
      memoryMb: 37.1,
      verdict: 'Optimal (100% Tests Passed)',
      verdictColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      code: `function twoSum(nums, target) {
  const map = new Map();
  // Single-pass O(1) average lookup
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      aiExplanation:
        'JavaScript ES6 Map provides hash-backed O(1) lookups. Runtime drops to 14ms with negligible memory differential.'
    }
  ]
};

export function HeroLandingPage() {
  const [selectedLang, setSelectedLang] = useState<'python' | 'javascript'>('python');
  const [activeTab, setActiveTab] = useState<number>(1); // 0 = Naive, 1 = Optimal

  const currentSample = SAMPLE_COMPARISONS[selectedLang][activeTab];

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFC] text-slate-900 overflow-hidden">
      {/* Background Micro Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center flex flex-col items-center">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 text-xs font-medium shadow-sm hover:bg-emerald-100/80 transition-all duration-200 cursor-default mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold tracking-wide">GV2 Architecture</span>
          <span className="text-emerald-400">•</span>
          <span>Isolated Judge0 Sandboxing & Gemini 1.5 Telemetry</span>
          <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl leading-[1.12] mb-6">
          Understand how code{' '}
          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent">
            evolves
          </span>
          , not just if it passes.
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed mb-10">
          A pedagogical coding evaluation platform. Submit in Python, JavaScript, C++, or Java. Receive isolated kernel metrics, deterministic edge-case diffs, and AI evolutionary narratives.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link
            to="/register"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md shadow-slate-900/10 hover:shadow-lg transition-all flex items-center justify-center gap-2.5 group"
          >
            Start Coding Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            to="/problems"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white border border-slate-300/80 hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-sm hover:border-slate-400 transition-all flex items-center justify-center gap-2"
          >
            Explore Problem Catalog
          </Link>
        </div>

        {/* Key Feature Specs Chips */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl w-full mb-16 text-xs text-slate-600 font-medium">
          <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <Cpu className="w-4 h-4 text-emerald-600" />
            <span>Judge0 Hardened cgroups</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Gemini 1.5 Dual-Mode AI</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Deterministic Diff Engine</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <span>Fair Language Multipliers</span>
          </div>
        </div>

        {/* ================================================================== */}
        {/* LIVE INTERACTIVE CODE EVOLUTION DEMO WIDGET                        */}
        {/* ================================================================== */}
        <div className="w-full max-w-5xl rounded-2xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-200/50 overflow-hidden text-left">
          {/* Widget Header Bar */}
          <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400/80" />
              <span className="w-3 h-3 rounded-full bg-amber-400/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
              <span className="ml-2 text-xs font-mono font-medium text-slate-500">
                evolution-lab :: Two Sum [Problem #1]
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs font-medium text-slate-600">
                <button
                  onClick={() => setSelectedLang('python')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    selectedLang === 'python'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Python
                </button>
                <button
                  onClick={() => setSelectedLang('javascript')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    selectedLang === 'javascript'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  JavaScript
                </button>
              </div>
            </div>
          </div>

          {/* Approach Tabs */}
          <div className="flex border-b border-slate-200 bg-white px-5 pt-2 gap-2 text-xs font-medium">
            <button
              onClick={() => setActiveTab(0)}
              className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition ${
                activeTab === 0
                  ? 'border-amber-500 text-amber-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              01. Naive Brute-Force O(N²)
            </button>
            <button
              onClick={() => setActiveTab(1)}
              className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition ${
                activeTab === 1
                  ? 'border-emerald-600 text-emerald-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              02. Optimal Hash Map O(N) (Selected)
            </button>
          </div>

          {/* Code & Telemetry Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
            {/* Left: Code Viewer */}
            <div className="lg:col-span-7 p-5 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed flex flex-col justify-between overflow-x-auto">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 text-[11px] text-slate-400">
                  <span>{currentSample.title}</span>
                  <span className="text-emerald-400 font-mono">Verified Syntax</span>
                </div>
                <pre className="text-slate-200 selection:bg-indigo-600">
                  <code>{currentSample.code}</code>
                </pre>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Isolated Judge0 CE v1.13.1 Sandbox
                </span>
                <span className="text-slate-500">cgroup: ram 256MB • cpu 2s</span>
              </div>
            </div>

            {/* Right: Empirical Telemetry & AI Diagnostic */}
            <div className="lg:col-span-5 p-6 bg-slate-50/50 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Empirical Telemetry
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${currentSample.verdictColor}`}
                  >
                    {currentSample.verdict}
                  </span>
                </div>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mb-1 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Runtime
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold font-mono text-slate-900">
                        {currentSample.runtimeMs} ms
                      </span>
                      {activeTab === 1 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          -98.7%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mb-1 font-medium">
                      <HardDrive className="w-3 h-3 text-slate-400" />
                      Memory
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold font-mono text-slate-900">
                        {currentSample.memoryMb} MB
                      </span>
                      <span className="text-[10px] text-slate-500">Heap</span>
                    </div>
                  </div>
                </div>

                {/* Big-O Complexity Card */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-indigo-500" />
                    Asymptotic Complexity Bounds
                  </span>
                  <p className="font-mono text-xs font-semibold text-slate-800">
                    {currentSample.complexity}
                  </p>
                </div>

                {/* Gemini Pedagogical Explanation */}
                <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Gemini 1.5 Pedagogical Insights
                  </div>
                  <p className="text-xs text-indigo-950/80 leading-relaxed">
                    {currentSample.aiExplanation}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Want to test your approach?</span>
                <Link
                  to="/workspace/two-sum-optimal"
                  className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  Solve in Workspace
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 3 CORE PILLARS (Clean White Bento Cards)                           */}
      {/* ================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200/70">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
            Pedagogical Architecture
          </h2>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Built to understand code, not just rank it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Hardened Judge0 Execution
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Code runs inside isolated Linux cgroups. Micro-measurements capture exact kernel user/sys time and peak memory without host interference.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Zero-leakage test case diffs</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Dual-Mode AI Telemetry
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Gemini 1.5 analyzes Big-O asymptotic limits, code smells, and edge cases. Mode A offers algorithmic optimization; Mode B provides counter-example diagnostics.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
              <span>Separated from empirical numbers</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <GitCompare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Peer Solution Evolution
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Compare multiple approaches side-by-side. Inspect time vs space tradeoffs across Python, JavaScript, C++, and Java with fair multiplier weighting.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>Fair logarithmic benchmarking</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* BOTTOM CONVERSION CTA BANNER                                       */}
      {/* ================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 p-10 sm:p-16 text-center text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to evolve your coding approach?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Join students and developers analyzing how algorithms perform in real sandboxes. Free access with full Judge0 telemetry and AI analytics.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-md transition"
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition"
              >
                Sign In to Lab
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
