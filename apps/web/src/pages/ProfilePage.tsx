import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Github,
  Calendar,
  Award,
  Zap,
  Flame,
  CheckCircle2,
  Clock,
  HardDrive,
  BarChart2,
  ExternalLink,
  Edit3,
  Share2,
  Code2,
  Sparkles,
  Trophy,
  Layers,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  Camera
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';

interface PastEvolution {
  id: string;
  problemId: string;
  problemTitle: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  language: string;
  initialRuntimeMs: number;
  optimalRuntimeMs: number;
  initialMemoryMb: number;
  optimalMemoryMb: number;
  speedupPercent: number;
  pedagogicalVerdict: string;
  date: string;
}

const SAMPLE_EVOLUTIONS: PastEvolution[] = [
  {
    id: 'evo-1',
    problemId: 'two-sum-optimal',
    problemTitle: 'Two Sum',
    difficulty: 'Easy',
    language: 'Python',
    initialRuntimeMs: 1420,
    optimalRuntimeMs: 18,
    initialMemoryMb: 14.1,
    optimalMemoryMb: 15.3,
    speedupPercent: 98.7,
    pedagogicalVerdict: 'Replaced O(N²) quadratic nested loop with single-pass hash map',
    date: '2 hours ago'
  },
  {
    id: 'evo-2',
    problemId: 'longest-substring-without-repeating',
    problemTitle: 'Longest Substring Without Repeating',
    difficulty: 'Medium',
    language: 'TypeScript',
    initialRuntimeMs: 980,
    optimalRuntimeMs: 14,
    initialMemoryMb: 36.2,
    optimalMemoryMb: 37.1,
    speedupPercent: 98.5,
    pedagogicalVerdict: 'Dynamic sliding window eliminated inner substring re-scans',
    date: 'Yesterday'
  },
  {
    id: 'evo-3',
    problemId: 'valid-parentheses',
    problemTitle: 'Valid Parentheses',
    difficulty: 'Easy',
    language: 'C++',
    initialRuntimeMs: 120,
    optimalRuntimeMs: 2,
    initialMemoryMb: 7.8,
    optimalMemoryMb: 8.1,
    speedupPercent: 98.3,
    pedagogicalVerdict: 'std::stack linear scan with O(1) matching table',
    date: '3 days ago'
  },
  {
    id: 'evo-4',
    problemId: 'merge-intervals',
    problemTitle: 'Merge Intervals',
    difficulty: 'Medium',
    language: 'Python',
    initialRuntimeMs: 840,
    optimalRuntimeMs: 32,
    initialMemoryMb: 18.2,
    optimalMemoryMb: 18.9,
    speedupPercent: 96.2,
    pedagogicalVerdict: 'O(N log N) greedy merge after sorting start coordinates',
    date: '5 days ago'
  }
];

const BADGES = [
  {
    id: 'badge-1',
    name: 'Quadratic Slayer',
    description: 'Transformed an O(N²) quadratic algorithm into O(N) linear time',
    icon: Zap,
    color: 'from-amber-500 to-emerald-500',
    unlocked: true,
    earnedAt: 'Nov 2026'
  },
  {
    id: 'badge-2',
    name: 'Sub-10ms Sprinter',
    description: 'Passed 100% hidden Judge0 test cases in under 10 milliseconds',
    icon: Clock,
    color: 'from-emerald-500 to-teal-500',
    unlocked: true,
    earnedAt: 'Nov 2026'
  },
  {
    id: 'badge-3',
    name: 'Memory Minimalist',
    description: 'Achieved optimal space complexity with zero heap leakage',
    icon: HardDrive,
    color: 'from-indigo-500 to-cyan-500',
    unlocked: true,
    earnedAt: 'Nov 2026'
  },
  {
    id: 'badge-4',
    name: '5-Day Evolution Streak',
    description: 'Submitted algorithmic solutions for 5 consecutive days',
    icon: Flame,
    color: 'from-rose-500 to-amber-500',
    unlocked: true,
    earnedAt: 'Nov 2026'
  },
  {
    id: 'badge-5',
    name: 'Polyglot Architect',
    description: 'Solved problems across 3 different programming languages',
    icon: Code2,
    color: 'from-purple-500 to-indigo-500',
    unlocked: true,
    earnedAt: 'Nov 2026'
  },
  {
    id: 'badge-6',
    name: 'Kernel Isolation Master',
    description: 'Surpassed 50 isolated Linux cgroup evaluations',
    icon: ShieldCheck,
    color: 'from-slate-600 to-slate-900',
    unlocked: false,
    earnedAt: 'Locked'
  }
];

export function ProfilePage() {
  const { user, profile, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'evolution' | 'skills' | 'badges' | 'settings'>('evolution');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit form state
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [githubHandle, setGithubHandle] = useState(profile?.githubHandle || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setBio(profile.bio || '');
      setGithubHandle(profile.githubHandle || '');
      setAvatarUrl(profile.avatarUrl || '');
    }
  }, [profile]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/7.x/identicon/svg?seed=${randomSeed}`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const res = await api.patch('/auth/profile', {
        fullName,
        bio,
        githubHandle,
        avatarUrl
      });

      const updated = res.data.data.profile;
      updateProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSaveSuccess(false);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Generate 52 weeks of mock heatmap activity data
  const heatmapWeeks = Array.from({ length: 24 }).map((_, wIdx) =>
    Array.from({ length: 7 }).map((_, dIdx) => {
      // Deterministic pseudo-random pattern for realistic activity
      const val = (wIdx * 7 + dIdx * 3) % 11;
      return val > 6 ? (val % 4) + 1 : 0;
    })
  );

  return (
    <div className="flex-1 bg-[#FAFAFC] text-slate-900 pb-20 selection:bg-emerald-100 selection:text-emerald-950">
      {/* ================================================================== */}
      {/* 1. HERO IDENTITY CARD                                              */}
      {/* ================================================================== */}
      <div className="bg-white border-b border-slate-200/90 pt-10 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* User Identity info */}
            <div className="flex items-start sm:items-center gap-5">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 border-2 border-emerald-500/40 p-0.5 shadow-md overflow-hidden">
                  {profile?.avatarUrl || avatarUrl ? (
                    <img
                      src={profile?.avatarUrl || avatarUrl}
                      alt={user?.username}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-700 font-bold text-2xl font-mono">
                      {user?.username?.slice(0, 2).toUpperCase() || 'AI'}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-emerald-600 transition"
                  title="Change Avatar"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {profile?.fullName || user?.username || 'Algorithmic Explorer'}
                  </h1>
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    @{user?.username || 'developer'}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-emerald-600" />
                    Level 3 Algorithmist
                  </span>
                </div>

                <p className="text-sm text-slate-600 max-w-xl font-normal leading-relaxed">
                  {profile?.bio ||
                    'Optimizing algorithm complexities from quadratic O(N²) to linear O(N) using isolated Judge0 sandboxes.'}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user?.email || 'user@aica.lab'}</span>
                  </div>
                  {profile?.githubHandle && (
                    <a
                      href={`https://github.com/${profile.githubHandle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-700 transition"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>{profile.githubHandle}</span>
                    </a>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Nov 2026'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <button
                onClick={handleShare}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs hover:bg-slate-50 transition flex items-center gap-2 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Share Profile</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs hover:shadow transition flex items-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* ================================================================ */}
        {/* 2. BENTO STATS METRICS GRID                                      */}
        {/* ================================================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Problems Solved */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Problems Solved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {profile?.problemsSolved || 14}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ 50 Catalog</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
              <span>8 Easy</span> • <span>5 Medium</span> • <span>1 Hard</span>
            </div>
          </div>

          {/* Card 2: Algorithmic Speedup Delta */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Evolution Delta</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">
                98.4%
              </span>
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                Avg Drop
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">
              Average latency reduction across iterations
            </p>
          </div>

          {/* Card 3: Total Submissions */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Runs</span>
              <Code2 className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {profile?.totalSubmissions || 42}
              </span>
              <span className="text-xs text-slate-500 font-medium">Isolated passes</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">
              cgroup kernel evaluations performed
            </p>
          </div>

          {/* Card 4: Current Streak */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Evolution Streak</span>
              <Flame className="w-4 h-4 text-rose-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono flex items-center gap-1">
                {profile?.currentStreak || 5} <span className="text-xl">Days</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">
              Consistent daily algorithmic mastery
            </p>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 3. GITHUB-STYLE 52-WEEK ACTIVITY HEATMAP                         */}
        {/* ================================================================ */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Annual Evaluation Activity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                42 kernel evaluations and submissions across past months
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span>Less</span>
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-100 border border-slate-200" />
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-200" />
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400" />
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
              <span>More</span>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-1 min-w-[640px]">
              {heatmapWeeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((level, dIdx) => {
                    const bgClass =
                      level === 0
                        ? 'bg-slate-100 hover:bg-slate-200'
                        : level === 1
                        ? 'bg-emerald-200 hover:bg-emerald-300'
                        : level === 2
                        ? 'bg-emerald-400 hover:bg-emerald-500'
                        : 'bg-emerald-600 hover:bg-emerald-700';

                    return (
                      <div
                        key={dIdx}
                        className={`w-3.5 h-3.5 rounded-xs ${bgClass} transition-colors cursor-pointer`}
                        title={`Week ${wIdx + 1}: ${level > 0 ? level * 2 : 0} runs`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 4. TABBED NAVIGATION (Evolution, Skills, Badges, Settings)        */}
        {/* ================================================================ */}
        <div className="space-y-6">
          <div className="flex border-b border-slate-200 gap-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('evolution')}
              className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'evolution'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Zap className="w-4 h-4" />
              Evolution History ({SAMPLE_EVOLUTIONS.length})
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'skills'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Languages & Skills
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'badges'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4" />
              Mastery Badges ({BADGES.filter(b => b.unlocked).length}/{BADGES.length})
            </button>
          </div>

          {/* TAB 1: EVOLUTION HISTORY FEED */}
          {activeTab === 'evolution' && (
            <div className="space-y-4">
              {SAMPLE_EVOLUTIONS.map((evo) => (
                <div
                  key={evo.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-base text-slate-900">
                        {evo.problemTitle}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                          evo.difficulty === 'Easy'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : evo.difficulty === 'Medium'
                            ? 'text-amber-700 bg-amber-50 border-amber-200'
                            : 'text-rose-700 bg-rose-50 border-rose-200'
                        }`}
                      >
                        {evo.difficulty}
                      </span>
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {evo.language}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{evo.date}</span>
                      <Link
                        to={`/workspace/${evo.problemId}`}
                        className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                      >
                        Open Workspace
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Latency & Memory Transition Ribbon */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs">
                    {/* Runtime Delta */}
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">
                        Execution Latency Transition
                      </span>
                      <div className="flex items-baseline gap-2 font-mono">
                        <span className="text-slate-400 line-through">
                          {evo.initialRuntimeMs}ms
                        </span>
                        <span className="text-slate-400">&rarr;</span>
                        <span className="font-extrabold text-slate-900">
                          {evo.optimalRuntimeMs}ms
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                          -{evo.speedupPercent}%
                        </span>
                      </div>
                    </div>

                    {/* Memory Footprint */}
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">
                        Peak Memory Footprint
                      </span>
                      <div className="flex items-baseline gap-2 font-mono text-slate-700">
                        <span>{evo.initialMemoryMb} MB</span>
                        <span className="text-slate-400">&rarr;</span>
                        <span className="font-semibold text-slate-900">
                          {evo.optimalMemoryMb} MB
                        </span>
                        <span className="text-[10px] text-slate-400">(Heap)</span>
                      </div>
                    </div>

                    {/* Pedagogical Verdict */}
                    <div className="sm:col-span-2 lg:col-span-1">
                      <span className="text-[11px] text-slate-500 block mb-1">
                        Gemini AST Verdict
                      </span>
                      <p className="text-xs text-slate-800 font-medium leading-relaxed truncate">
                        {evo.pedagogicalVerdict}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: LANGUAGES & SKILLS BREAKDOWN */}
          {activeTab === 'skills' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Language Distribution */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-5">
                <h3 className="text-sm font-bold text-slate-900">
                  Language Distribution
                </h3>

                {/* Progress Multi-Bar */}
                <div className="h-3 w-full rounded-full bg-slate-100 flex overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: '48%' }} title="Python 48%" />
                  <div className="bg-indigo-500 h-full" style={{ width: '30%' }} title="TypeScript 30%" />
                  <div className="bg-amber-500 h-full" style={{ width: '14%' }} title="C++ 14%" />
                  <div className="bg-teal-400 h-full" style={{ width: '8%' }} title="JavaScript 8%" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-800">Python</span>
                    <span className="text-slate-500 font-mono ml-auto">48%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="font-semibold text-slate-800">TypeScript</span>
                    <span className="text-slate-500 font-mono ml-auto">30%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="font-semibold text-slate-800">C++</span>
                    <span className="text-slate-500 font-mono ml-auto">14%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-teal-400" />
                    <span className="font-semibold text-slate-800">JavaScript</span>
                    <span className="text-slate-500 font-mono ml-auto">8%</span>
                  </div>
                </div>
              </div>

              {/* Algorithmic Paradigms */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Mastered Algorithmic Paradigms
                </h3>

                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Hash Tables (O(1) Lookups)
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
                    Two Pointers & Sliding Window
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                    Dynamic Programming (Memoization)
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                    Binary Search Trees
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                    Monotonic Stacks & Queues
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MASTERY BADGES */}
          {activeTab === 'badges' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {BADGES.map((badge) => {
                const IconComponent = badge.icon;
                return (
                  <div
                    key={badge.id}
                    className={`p-5 rounded-2xl border transition flex items-start gap-4 ${
                      badge.unlocked
                        ? 'bg-white border-slate-200/90 shadow-xs hover:border-emerald-300'
                        : 'bg-slate-50/50 border-dashed border-slate-200 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${badge.color} text-white flex items-center justify-center shrink-0 shadow-sm`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {badge.name}
                        </h4>
                        {badge.unlocked && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Unlocked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {badge.description}
                      </p>
                      <span className="text-[10px] font-mono text-slate-400 block pt-1">
                        {badge.earnedAt}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* 5. EDIT PROFILE MODAL                                              */}
      {/* ================================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-slate-900 mb-1">
              Edit Developer Profile
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Update your public persona, bio, and social connections.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {errorMsg}
              </div>
            )}

            {saveSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Profile updated successfully!
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-medium">
              {/* Full Name */}
              <div>
                <label className="block text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Mohan Kunjam"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-slate-700 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief summary of your algorithmic focus..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900 resize-none"
                />
              </div>

              {/* GitHub Handle */}
              <div>
                <label className="block text-slate-700 mb-1">GitHub Username</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400">@</span>
                  <input
                    type="text"
                    value={githubHandle}
                    onChange={(e) => setGithubHandle(e.target.value)}
                    placeholder="github_username"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900"
                  />
                </div>
              </div>

              {/* Avatar URL & Randomizer */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700">Avatar Image URL</label>
                  <button
                    type="button"
                    onClick={handleRandomAvatar}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Generate Random Avatar
                  </button>
                </div>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900 font-mono text-[11px]"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition disabled:opacity-60 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
