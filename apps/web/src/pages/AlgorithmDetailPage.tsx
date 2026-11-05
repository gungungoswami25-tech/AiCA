import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, Workflow } from 'lucide-react';
import { api } from '../services/api';
import type { Algorithm } from './AlgorithmsPage';

export function AlgorithmDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<'javascript' | 'python'>('javascript');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get(`/algorithms/${encodeURIComponent(slug || '')}`)
      .then(({ data }) => { if (active) setAlgorithm(data.data); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Could not load this algorithm. Check your connection and try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  const copyCode = async () => {
    if (!algorithm) return;
    try {
      await navigator.clipboard.writeText(algorithm.code[language]);
      setCopyError('');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError('Clipboard access is unavailable in this browser context.');
    }
  };

  if (loading) return <div className="max-w-5xl mx-auto w-full px-4 py-16 text-center text-slate-500">Loading algorithm...</div>;
  if (error || !algorithm) return <div className="max-w-5xl mx-auto w-full px-4 py-10 space-y-5"><Link to="/algorithms" className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400"><ArrowLeft className="w-4 h-4" />All algorithms</Link><div role="alert" className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-sm text-rose-700 dark:text-rose-300">{error || 'Algorithm not found.'}</div></div>;

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 space-y-7">
      <Link to="/algorithms" className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"><ArrowLeft className="w-4 h-4" />All algorithms</Link>
      <header className="space-y-3"><span className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-300"><Workflow className="w-4 h-4" />{algorithm.category}</span><h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{algorithm.name}</h1><p className="text-slate-600 dark:text-slate-400 leading-relaxed">{algorithm.description}</p></header>
      <section className="grid sm:grid-cols-2 gap-3"><div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"><p className="text-xs text-slate-500">Time complexity</p><code className="mt-1 block text-sm text-slate-900 dark:text-slate-100">{algorithm.timeComplexity}</code></div><div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"><p className="text-xs text-slate-500">Space complexity</p><code className="mt-1 block text-sm text-slate-900 dark:text-slate-100">{algorithm.spaceComplexity}</code></div></section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800"><div className="flex gap-2" role="tablist" aria-label="Code language">{(['javascript', 'python'] as const).map((item) => <button key={item} role="tab" aria-selected={language === item} onClick={() => { setLanguage(item); setCopied(false); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${language === item ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>{item === 'javascript' ? 'JavaScript' : 'Python'}</button>)}</div><button onClick={copyCode} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800" aria-label="Copy code">{copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'Copied' : 'Copy code'}</button></div>
        <pre className="overflow-x-auto p-5 text-sm leading-6 text-slate-100"><code>{algorithm.code?.[language] || 'No code provided for this language.'}</code></pre>
      </section>
      {copyError && <p role="status" className="text-sm text-rose-600 dark:text-rose-400">{copyError}</p>}
      <section className="space-y-4"><h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">How it works</h2>{algorithm.steps?.length ? <ol className="space-y-3">{algorithm.steps.map((step, index) => <li key={`${index}-${step}`} className="flex gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"><span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold">{index + 1}</span><span className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{step}</span></li>)}</ol> : <p className="text-sm text-slate-500">No step-by-step explanation is available yet.</p>}</section>
    </div>
  );
}
