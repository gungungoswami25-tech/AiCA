import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  Send,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Cpu
} from 'lucide-react';
import {
  Problem,
  SupportedLanguage,
  LANGUAGE_CONFIGS,
  SubmissionStatusStreamEvent
} from '@aica/shared';
import { api } from '../services/api';
import { useSubmissionSSE } from '../hooks/useSSE';
import { useThemeStore } from '../store/useThemeStore';

interface MonacoWorkspaceProps {
  problem: Problem;
  onEvaluationComplete?: (reportId: string, submissionId: string) => void;
}

export function MonacoWorkspace({ problem, onEvaluationComplete }: MonacoWorkspaceProps) {
  const { isDark } = useThemeStore();
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [code, setCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'tests' | 'console'>('tests');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string | null>(null);
  const [activeTestIndex, setActiveTestIndex] = useState(0);

  const { currentEvent, isStreaming, startStream } = useSubmissionSSE(null);

  // Load starter code or saved draft
  useEffect(() => {
    const draftKey = `draft_${problem.id}_${language}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      setCode(savedDraft);
    } else {
      const defaultCode =
        problem.starterCode?.[language] || LANGUAGE_CONFIGS[language].defaultBoilerplate;
      setCode(defaultCode);
    }
  }, [problem, language]);

  // Handle Code Change & Draft Saving
  const handleCodeChange = (value?: string) => {
    const newCode = value || '';
    setCode(newCode);
    localStorage.setItem(`draft_${problem.id}_${language}`, newCode);
  };

  const handleReset = () => {
    const defaultCode =
      problem.starterCode?.[language] || LANGUAGE_CONFIGS[language].defaultBoilerplate;
    setCode(defaultCode);
    localStorage.removeItem(`draft_${problem.id}_${language}`);
  };

  const handleSubmit = async (isTestRun: boolean) => {
    setIsSubmitting(true);
    setConsoleOutput(null);
    setActiveTab('console');

    try {
      const response = await api.post('/submissions', {
        problemId: problem.id,
        language,
        code,
        isTestRun
      });

      const submissionId = response.data.data.submissionId;
      startStream(submissionId);

      // Polling fallback to check completion
      const checkInterval = setInterval(async () => {
        try {
          const subRes = await api.get(`/submissions/${submissionId}`);
          const subData = subRes.data.data;

          if (subData.pipelineStatus === 'COMPLETED' || subData.pipelineStatus === 'FAILED') {
            clearInterval(checkInterval);
            setIsSubmitting(false);

            if (subData.verdict === 'ACCEPTED') {
              setConsoleOutput(`Verdict: ACCEPTED\nPassed: ${subData.testCasesPassed}/${subData.testCasesTotal}\nTime: ${subData.executionTimeMs}ms\nMemory: ${subData.memoryUsedKb}KB\nComposite Score: ${subData.compositeScore}`);
            } else {
              setConsoleOutput(`Verdict: ${subData.verdict}\nPassed: ${subData.testCasesPassed}/${subData.testCasesTotal}\n${subData.compileOutput || 'Failed test verification.'}`);
            }

            if (onEvaluationComplete && subData.evaluationReportId) {
              onEvaluationComplete(subData.evaluationReportId, submissionId);
            }
          }
        } catch {
          // keep polling until complete
        }
      }, 1000);
    } catch (err: any) {
      setIsSubmitting(false);
      setConsoleOutput(`Submission error: ${err.response?.data?.error?.message || err.message}`);
    }
  };

  const publicTestCases = problem.testCases || [];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-colors duration-200">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 font-mono shadow-2xs"
          >
            <option value="python">Python (3.10)</option>
            <option value="javascript">JavaScript (Node 18)</option>
            <option value="cpp">C++ (GCC 12)</option>
            <option value="java">Java (OpenJDK 17)</option>
          </select>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition"
            title="Reset to boilerplate"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting || isStreaming}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold disabled:opacity-50 transition"
          >
            <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
            Run Code
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting || isStreaming}
            className="flex items-center gap-2 px-5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 disabled:opacity-50 transition"
          >
            <Send className="w-3.5 h-3.5" />
            Submit Solution
          </button>
        </div>
      </div>

      {/* Real-time SSE Progress Ribbon */}
      {(isSubmitting || isStreaming || currentEvent) && (
        <div className="bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-500/20 px-4 py-2 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>
            <span className="text-indigo-700 dark:text-indigo-300 font-semibold">
              Stage: {currentEvent?.pipelineStatus || 'QUEUED'}
            </span>
            {currentEvent?.verdict && currentEvent.verdict !== 'PENDING' && (
              <span className="text-slate-600 dark:text-slate-400">Verdict: {currentEvent.verdict}</span>
            )}
          </div>
          <span className="text-slate-500">
            Step {currentEvent?.step || 1} of {currentEvent?.totalSteps || 4}
          </span>
        </div>
      )}

      {/* Monaco Code Editor Canvas */}
      <div className="flex-1 min-h-[350px]">
        <Editor
          height="100%"
          language={LANGUAGE_CONFIGS[language].monacoLanguage}
          theme={isDark ? "vs-dark" : "light"}
          value={code}
          onChange={handleCodeChange}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            fontFamily: "'Fira Code', monospace"
          }}
        />
      </div>

      {/* Bottom Test Case & Console Panel */}
      <div className="h-48 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
        <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-xs font-medium">
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-1.5 pb-1 ${
              activeTab === 'tests'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Test Cases ({publicTestCases.length})
          </button>
          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 pb-1 ${
              activeTab === 'console'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Execution Console
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto text-xs font-mono">
          {activeTab === 'tests' ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                {publicTestCases.map((tc, idx) => (
                  <button
                    key={tc.id || idx}
                    onClick={() => setActiveTestIndex(idx)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold ${
                      activeTestIndex === idx
                        ? 'bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-300 dark:border-slate-700'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-transparent'
                    }`}
                  >
                    Case {idx + 1}
                  </button>
                ))}
              </div>

              {publicTestCases[activeTestIndex] && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="bg-white dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block mb-1 font-sans text-xs">Standard Input (stdin):</span>
                    <pre className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{publicTestCases[activeTestIndex].input}</pre>
                  </div>
                  <div className="bg-white dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block mb-1 font-sans text-xs">Expected Output:</span>
                    <pre className="text-emerald-600 dark:text-emerald-400 whitespace-pre-wrap">{publicTestCases[activeTestIndex].expectedOutput}</pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {consoleOutput ? (
                <pre className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{consoleOutput}</pre>
              ) : (
                <div className="text-slate-400 dark:text-slate-500 italic py-4 text-center font-sans">
                  Click &quot;Run Code&quot; or &quot;Submit Solution&quot; to inspect isolated Judge0 stdout, stderr, and execution telemetry.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
