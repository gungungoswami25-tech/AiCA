import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sanitizeMongoUri } from '@aica/shared';
import Algorithm from '../models/mongodb/algorithm.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

const algorithms = [
  {
    name: 'Binary Search', slug: 'binary-search', category: 'Searching',
    description: 'Find a target in a sorted array by repeatedly discarding the half that cannot contain it.',
    timeComplexity: 'O(log n)', spaceComplexity: 'O(1)',
    code: {
      javascript: `function binarySearch(values, target) {\n  let left = 0;\n  let right = values.length - 1;\n\n  while (left <= right) {\n    const middle = Math.floor((left + right) / 2);\n    if (values[middle] === target) return middle;\n    if (values[middle] < target) left = middle + 1;\n    else right = middle - 1;\n  }\n\n  return -1;\n}`,
      python: `def binary_search(values, target):\n    left, right = 0, len(values) - 1\n\n    while left <= right:\n        middle = (left + right) // 2\n        if values[middle] == target:\n            return middle\n        if values[middle] < target:\n            left = middle + 1\n        else:\n            right = middle - 1\n\n    return -1`,
    },
    steps: ['Set the search bounds to the first and last array indices.', 'Inspect the middle element of the current range.', 'Return its index when it matches the target.', 'Discard the left or right half based on the sorted order.', 'Repeat until found or the range becomes empty.'],
  },
  {
    name: 'Merge Sort', slug: 'merge-sort', category: 'Sorting',
    description: 'Sort an array by recursively sorting halves and merging the sorted results.',
    timeComplexity: 'O(n log n)', spaceComplexity: 'O(n)',
    code: {
      javascript: `function mergeSort(values) {\n  if (values.length <= 1) return values;\n  const middle = Math.floor(values.length / 2);\n  const left = mergeSort(values.slice(0, middle));\n  const right = mergeSort(values.slice(middle));\n  const merged = [];\n  let i = 0, j = 0;\n  while (i < left.length && j < right.length) {\n    merged.push(left[i] <= right[j] ? left[i++] : right[j++]);\n  }\n  return merged.concat(left.slice(i), right.slice(j));\n}`,
      python: `def merge_sort(values):\n    if len(values) <= 1:\n        return values\n    middle = len(values) // 2\n    left = merge_sort(values[:middle])\n    right = merge_sort(values[middle:])\n    merged, i, j = [], 0, 0\n    while i < len(left) and j < len(right):\n        if left[i] <= right[j]:\n            merged.append(left[i]); i += 1\n        else:\n            merged.append(right[j]); j += 1\n    return merged + left[i:] + right[j:]`,
    },
    steps: ['Split the input into two halves until each part has at most one value.', 'Sort each half recursively.', 'Compare the first unmerged value from each half.', 'Append the smaller value and advance that half.', 'Append any remaining values to produce the sorted result.'],
  },
  {
    name: 'Breadth-First Search', slug: 'breadth-first-search', category: 'Graphs',
    description: 'Visit a graph level by level from a starting node using a queue.',
    timeComplexity: 'O(V + E)', spaceComplexity: 'O(V)',
    code: {
      javascript: `function breadthFirstSearch(graph, start) {\n  const visited = new Set([start]);\n  const queue = [start];\n  const order = [];\n  for (let head = 0; head < queue.length; head++) {\n    const node = queue[head];\n    order.push(node);\n    for (const neighbor of graph[node] ?? []) {\n      if (!visited.has(neighbor)) {\n        visited.add(neighbor);\n        queue.push(neighbor);\n      }\n    }\n  }\n  return order;\n}`,
      python: `from collections import deque\n\ndef breadth_first_search(graph, start):\n    visited = {start}\n    queue = deque([start])\n    order = []\n    while queue:\n        node = queue.popleft()\n        order.append(node)\n        for neighbor in graph.get(node, []):\n            if neighbor not in visited:\n                visited.add(neighbor)\n                queue.append(neighbor)\n    return order`,
    },
    steps: ['Mark the start node visited and place it in a FIFO queue.', 'Remove the next node from the front and add it to the visit order.', 'For each unvisited neighbor, mark it visited and enqueue it.', 'Continue until the queue is empty.'],
  },
  {
    name: 'Linear Search', slug: 'linear-search', category: 'Searching',
    description: 'Find a target by checking each array value in order; works whether or not the array is sorted.',
    timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
    code: {
      javascript: `function linearSearch(values, target) {\n  for (let index = 0; index < values.length; index++) {\n    if (values[index] === target) return index;\n  }\n  return -1;\n}`,
      python: `def linear_search(values, target):\n    for index, value in enumerate(values):\n        if value == target:\n            return index\n    return -1`,
    },
    steps: ['Start at the first array element.', 'Compare the current value with the target.', 'Return the current index when they match.', 'Move to the next value and repeat.', 'Return -1 if the array ends without a match.'],
  },
  {
    name: 'Quick Sort', slug: 'quick-sort', category: 'Sorting',
    description: 'Sort values by partitioning them around a pivot, then sorting each partition recursively.',
    timeComplexity: 'O(n log n) average, O(n²) worst', spaceComplexity: 'O(log n) average recursion',
    code: {
      javascript: `function quickSort(values) {\n  if (values.length <= 1) return values;\n  const pivot = values[Math.floor(values.length / 2)];\n  const lower = [], equal = [], higher = [];\n  for (const value of values) {\n    if (value < pivot) lower.push(value);\n    else if (value > pivot) higher.push(value);\n    else equal.push(value);\n  }\n  return [...quickSort(lower), ...equal, ...quickSort(higher)];\n}`,
      python: `def quick_sort(values):\n    if len(values) <= 1:\n        return values\n    pivot = values[len(values) // 2]\n    lower = [value for value in values if value < pivot]\n    equal = [value for value in values if value == pivot]\n    higher = [value for value in values if value > pivot]\n    return quick_sort(lower) + equal + quick_sort(higher)`,
    },
    steps: ['Choose a pivot value from the input.', 'Partition values into those below, equal to, and above the pivot.', 'Recursively sort the lower and higher partitions.', 'Join the sorted lower partition, equal values, and sorted higher partition.'],
  },
  {
    name: 'Depth-First Search', slug: 'depth-first-search', category: 'Graphs',
    description: 'Explore a graph by following each path as far as possible before backtracking.',
    timeComplexity: 'O(V + E)', spaceComplexity: 'O(V)',
    code: {
      javascript: `function depthFirstSearch(graph, start) {\n  const visited = new Set();\n  const order = [];\n  function visit(node) {\n    if (visited.has(node)) return;\n    visited.add(node);\n    order.push(node);\n    for (const neighbor of graph[node] ?? []) visit(neighbor);\n  }\n  visit(start);\n  return order;\n}`,
      python: `def depth_first_search(graph, start):\n    visited = set()\n    order = []\n    def visit(node):\n        if node in visited:\n            return\n        visited.add(node)\n        order.append(node)\n        for neighbor in graph.get(node, []):\n            visit(neighbor)\n    visit(start)\n    return order`,
    },
    steps: ['Begin at the start node and mark it visited.', 'Record the node in the traversal order.', 'Recursively visit each neighbor that has not been seen.', 'Backtrack when a node has no unvisited neighbors.'],
  },
  {
    name: 'Two Sum', slug: 'two-sum', category: 'Arrays & Hash Maps',
    description: 'Return the indices of two values whose sum equals the target using a hash map for one-pass lookup.',
    timeComplexity: 'O(n)', spaceComplexity: 'O(n)',
    code: {
      javascript: `function twoSum(values, target) {\n  const indexByValue = new Map();\n  for (let index = 0; index < values.length; index++) {\n    const complement = target - values[index];\n    if (indexByValue.has(complement)) {\n      return [indexByValue.get(complement), index];\n    }\n    indexByValue.set(values[index], index);\n  }\n  return [];\n}`,
      python: `def two_sum(values, target):\n    index_by_value = {}\n    for index, value in enumerate(values):\n        complement = target - value\n        if complement in index_by_value:\n            return [index_by_value[complement], index]\n        index_by_value[value] = index\n    return []`,
    },
    steps: ['Create a map from values already seen to their indices.', 'For each value, calculate the complement needed to reach the target.', 'If the complement is in the map, return its index and the current index.', 'Otherwise, store the current value and index, then continue.'],
  },
  {
    name: "Kadane's Algorithm", slug: 'kadanes-algorithm', category: 'Arrays & Dynamic Programming',
    description: 'Find the maximum sum of any contiguous subarray in a single pass.',
    timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
    code: {
      javascript: `function maxSubarraySum(values) {\n  if (values.length === 0) return 0;\n  let current = values[0];\n  let best = values[0];\n  for (let index = 1; index < values.length; index++) {\n    current = Math.max(values[index], current + values[index]);\n    best = Math.max(best, current);\n  }\n  return best;\n}`,
      python: `def max_subarray_sum(values):\n    if not values:\n        return 0\n    current = best = values[0]\n    for value in values[1:]:\n        current = max(value, current + value)\n        best = max(best, current)\n    return best`,
    },
    steps: ['Initialize the best ending sum and overall best sum from the first value.', 'For each next value, decide whether to extend the current subarray or start a new one.', 'Update the overall best whenever the current sum improves it.', 'Return the largest sum found.'],
  },
  {
    name: 'Insertion Sort', slug: 'insertion-sort', category: 'Sorting',
    description: 'Build a sorted prefix by inserting each next value into its correct position.',
    timeComplexity: 'O(n²) average and worst; O(n) best', spaceComplexity: 'O(1) auxiliary',
    code: {
      javascript: `function insertionSort(values) {\n  const result = [...values];\n  for (let index = 1; index < result.length; index++) {\n    const value = result[index];\n    let position = index - 1;\n    while (position >= 0 && result[position] > value) {\n      result[position + 1] = result[position];\n      position--;\n    }\n    result[position + 1] = value;\n  }\n  return result;\n}`,
      python: `def insertion_sort(values):\n    result = values.copy()\n    for index in range(1, len(result)):\n        value = result[index]\n        position = index - 1\n        while position >= 0 and result[position] > value:\n            result[position + 1] = result[position]\n            position -= 1\n        result[position + 1] = value\n    return result`,
    },
    steps: ['Treat the first value as a sorted section.', 'Take the next value as the value to insert.', 'Shift larger values in the sorted section one position to the right.', 'Place the value in the open position and repeat for the remaining input.'],
  },
  {
    name: 'Fibonacci with Memoization', slug: 'fibonacci-memoization', category: 'Dynamic Programming',
    description: 'Compute Fibonacci numbers recursively while caching results so each subproblem is solved once.',
    timeComplexity: 'O(n)', spaceComplexity: 'O(n)',
    code: {
      javascript: `function fibonacci(n, memo = new Map()) {\n  if (n < 0) throw new RangeError('n must be non-negative');\n  if (n < 2) return n;\n  if (memo.has(n)) return memo.get(n);\n  const result = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);\n  memo.set(n, result);\n  return result;\n}`,
      python: `from functools import lru_cache\n\n@lru_cache(maxsize=None)\ndef fibonacci(n):\n    if n < 0:\n        raise ValueError('n must be non-negative')\n    if n < 2:\n        return n\n    return fibonacci(n - 1) + fibonacci(n - 2)`,
    },
    steps: ['Return n directly for the base cases 0 and 1.', 'Before computing a larger value, check whether it is already cached.', 'Compute the two preceding Fibonacci values recursively.', 'Cache their sum and return it.'],
  },
];

async function seedAlgorithms() {
  await mongoose.connect(sanitizeMongoUri(process.env.MONGODB_URI));
  for (const algorithm of algorithms) {
    await Algorithm.findOneAndUpdate({ slug: algorithm.slug }, algorithm, { upsert: true, new: true, runValidators: true });
  }
  console.log(`[Seed] Upserted ${algorithms.length} algorithms.`);
}

seedAlgorithms()
  .catch((error) => { console.error('[Seed] Algorithm seeding failed:', error); process.exitCode = 1; })
  .finally(async () => { if (mongoose.connection.readyState !== 0) await mongoose.disconnect(); });
