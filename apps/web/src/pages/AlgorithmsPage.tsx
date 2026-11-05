import { useMemo, useState } from 'react';
import { Search, Workflow, Clock3, Layers3 } from 'lucide-react';

type Algorithm = {
  name: string;
  category: string;
  description: string;
  time: string;
  space: string;
};

const algorithms: Algorithm[] = [
  { name: 'Bubble Sort', category: 'Sorting', description: 'Repeatedly swaps adjacent values that are out of order.', time: 'O(n²)', space: 'O(1)' },
  { name: 'Selection Sort', category: 'Sorting', description: 'Selects the smallest remaining value and places it next.', time: 'O(n²)', space: 'O(1)' },
  { name: 'Insertion Sort', category: 'Sorting', description: 'Builds a sorted section by inserting each value in place.', time: 'O(n²)', space: 'O(1)' },
  { name: 'Merge Sort', category: 'Sorting', description: 'Splits the input, sorts each half, then merges the results.', time: 'O(n log n)', space: 'O(n)' },
  { name: 'Quick Sort', category: 'Sorting', description: 'Partitions values around a pivot and sorts each partition.', time: 'O(n log n) avg', space: 'O(log n)' },
  { name: 'Heap Sort', category: 'Sorting', description: 'Uses a heap to repeatedly move the largest value into place.', time: 'O(n log n)', space: 'O(1)' },
  { name: 'Counting Sort', category: 'Sorting', description: 'Counts occurrences of values in a bounded integer range.', time: 'O(n + k)', space: 'O(k)' },
  { name: 'Linear Search', category: 'Searching', description: 'Checks each item in order until the target is found.', time: 'O(n)', space: 'O(1)' },
  { name: 'Binary Search', category: 'Searching', description: 'Halves the search range each step in a sorted collection.', time: 'O(log n)', space: 'O(1)' },
  { name: 'Breadth-First Search (BFS)', category: 'Graphs', description: 'Visits graph neighbors level by level using a queue.', time: 'O(V + E)', space: 'O(V)' },
  { name: 'Depth-First Search (DFS)', category: 'Graphs', description: 'Explores a path deeply before backtracking.', time: 'O(V + E)', space: 'O(V)' },
  { name: "Dijkstra's Algorithm", category: 'Graphs', description: 'Finds shortest paths from one source with non-negative weights.', time: 'O((V + E) log V)', space: 'O(V)' },
  { name: 'Bellman-Ford', category: 'Graphs', description: 'Finds shortest paths and can detect negative weight cycles.', time: 'O(V × E)', space: 'O(V)' },
  { name: 'Floyd-Warshall', category: 'Graphs', description: 'Finds shortest paths between every pair of vertices.', time: 'O(V³)', space: 'O(V²)' },
  { name: 'Kruskal’s Algorithm', category: 'Graphs', description: 'Builds a minimum spanning tree by adding lightest safe edges.', time: 'O(E log E)', space: 'O(V)' },
  { name: 'Topological Sort', category: 'Graphs', description: 'Orders a directed acyclic graph by its dependencies.', time: 'O(V + E)', space: 'O(V)' },
  { name: 'Two Pointers', category: 'Array & String', description: 'Moves two indices through data to solve pair and range problems.', time: 'O(n)', space: 'O(1)' },
  { name: 'Sliding Window', category: 'Array & String', description: 'Tracks a moving range to efficiently process subarrays or substrings.', time: 'O(n)', space: 'O(1)*' },
  { name: 'Prefix Sum', category: 'Array & String', description: 'Precomputes cumulative totals for fast range sum queries.', time: 'O(n) build', space: 'O(n)' },
  { name: 'Kadane’s Algorithm', category: 'Array & String', description: 'Finds the maximum-sum contiguous subarray in one pass.', time: 'O(n)', space: 'O(1)' },
  { name: 'KMP String Search', category: 'Array & String', description: 'Searches for a pattern using a prefix table to skip comparisons.', time: 'O(n + m)', space: 'O(m)' },
  { name: 'Rabin-Karp', category: 'Array & String', description: 'Uses rolling hashes to find a pattern in text.', time: 'O(n + m) avg', space: 'O(1)' },
  { name: 'Fibonacci (Memoization)', category: 'Dynamic Programming', description: 'Caches smaller results so each subproblem is solved once.', time: 'O(n)', space: 'O(n)' },
  { name: '0/1 Knapsack', category: 'Dynamic Programming', description: 'Maximizes value under a capacity using include-or-skip choices.', time: 'O(n × capacity)', space: 'O(capacity)' },
  { name: 'Longest Common Subsequence', category: 'Dynamic Programming', description: 'Finds the longest ordered subsequence shared by two strings.', time: 'O(n × m)', space: 'O(n × m)' },
  { name: 'Coin Change', category: 'Dynamic Programming', description: 'Finds the minimum coins or number of ways to make a target.', time: 'O(amount × coins)', space: 'O(amount)' },
  { name: 'Backtracking', category: 'Backtracking', description: 'Builds candidate solutions and reverses choices that cannot work.', time: 'Often exponential', space: 'O(depth)' },
  { name: 'N-Queens', category: 'Backtracking', description: 'Places queens so no two can attack each other.', time: 'O(n!)', space: 'O(n)' },
  { name: 'Union-Find (Disjoint Set)', category: 'Data Structures', description: 'Tracks connected groups with near-constant union and find operations.', time: 'O(α(n))*', space: 'O(n)' },
  { name: 'Trie', category: 'Data Structures', description: 'Stores strings by shared prefixes for fast lookup and autocomplete.', time: 'O(length)', space: 'O(total chars)' },
];

const categories = ['All', ...Array.from(new Set(algorithms.map((algorithm) => algorithm.category)))];

export function AlgorithmsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filteredAlgorithms = useMemo(() => {
    const query = search.trim().toLowerCase();
    return algorithms.filter((algorithm) => {
      const matchesCategory = category === 'All' || algorithm.category === category;
      const matchesSearch = !query || `${algorithm.name} ${algorithm.category} ${algorithm.description}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <Workflow className="w-8 h-8 text-purple-500 dark:text-purple-400" />
          Algorithms Library
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Common programming algorithms, organized by topic with a quick overview of their complexity.</p>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          placeholder="Search algorithms or topics..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-xs transition"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              category === item
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{filteredAlgorithms.length} algorithms</span>
        <span>Complexity is a general reference; it can vary by implementation.</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-xs">
        <div className="hidden md:grid grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)_minmax(120px,0.8fr)_minmax(100px,0.7fr)] gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-900 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
          <span>Algorithm</span><span>What it does</span><span>Time</span><span>Space</span>
        </div>
        {filteredAlgorithms.length ? filteredAlgorithms.map((algorithm) => (
          <article key={algorithm.name} className="grid grid-cols-1 md:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)_minmax(120px,0.8fr)_minmax(100px,0.7fr)] gap-2 md:gap-4 px-5 py-4 border-t border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-900 transition">
            <div>
              <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-200">{algorithm.name}</h2>
              <span className="inline-flex items-center gap-1 mt-1 text-[11px] text-indigo-600 dark:text-indigo-300"><Layers3 className="w-3 h-3" />{algorithm.category}</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{algorithm.description}</p>
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 md:block"><Clock3 className="w-3.5 h-3.5 inline mr-1.5 text-emerald-500 dark:text-emerald-400 md:hidden" /><span className="text-slate-500 dark:text-slate-400 md:hidden">Time:</span><code>{algorithm.time}</code></div>
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 md:block"><span className="text-slate-500 dark:text-slate-400 md:hidden">Space:</span><code>{algorithm.space}</code></div>
          </article>
        )) : (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">No algorithms found. Try another search or topic.</div>
        )}
      </div>
    </div>
  );
}
