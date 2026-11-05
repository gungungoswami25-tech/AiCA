export interface MultiComparisonSolutionInput {
  submissionId: string;
  username: string;
  versionLabel?: string;
  language: string;
  code: string;
  timeMs: number;
  memoryKb: number;
  verdict: string;
}

export interface MultiComparisonPromptContext {
  problemTitle: string;
  problemDescription?: string;
  solutions: MultiComparisonSolutionInput[];
}

export function buildMultiComparisonPrompt(ctx: MultiComparisonPromptContext): string {
  const solutionsText = ctx.solutions
    .map(
      (s, idx) => `Solution #${idx + 1} (${s.username} - ${s.versionLabel || `Version ${idx + 1}`}):
Submission ID: ${s.submissionId}
Language: ${s.language}
Verdict: ${s.verdict}
Empirical Execution Time (Sandbox): ${s.timeMs} ms
Memory Usage: ${s.memoryKb} KB
<code>
${s.code}
</code>`
    )
    .join('\n\n');

  return `You are a Principal Algorithms Professor and Senior Systems Architect.
Compare and synthesize these ${ctx.solutions.length} distinct student solutions to the challenge: "${ctx.problemTitle}".
${ctx.problemDescription ? `Problem Description Context: ${ctx.problemDescription}` : ''}

${solutionsText}

INSTRUCTIONS:
1. Classify the concrete algorithmic paradigm/strategy of each solution (e.g. Bubble Sort, Merge Sort, Quick Sort, Hash Map, etc.).
2. Determine theoretical asymptotic Big-O (Time and Space) for each solution.
3. For each solution, identify key strengths, critical bottlenecks/weaknesses, and concrete optimization opportunities.
4. Compare how these algorithms behave as problem scale grows (e.g., N = 10,000 numbers):
   - Contrast asymptotic runtime (e.g. O(N^2) quadratic vs O(N log N) linearithmic).
   - Contrast auxiliary memory trade-offs (e.g. in-place O(1) vs recursive buffer O(N)).
   - Explain edge-case performance degradation (e.g. Quick Sort worst-case on sorted data without randomized pivot).
5. Contrast theoretical asymptotic Big-O vs empirical execution time measured in a controlled sandbox environment.
6. Return ONLY a valid JSON object matching this schema:
{
  "solutions": [
    {
      "submissionId": "exact submission ID matching input",
      "algorithmName": "e.g. Bubble Sort",
      "versionLabel": "e.g. Version 1",
      "timeComplexity": "e.g. O(N^2)",
      "spaceComplexity": "e.g. O(1)",
      "keyStrengths": ["string"],
      "weaknessesOrBottlenecks": ["string"],
      "optimizationNotes": "string"
    }
  ],
  "rankings": [
    {
      "algorithmName": "string",
      "timeComplexity": "string",
      "spaceComplexity": "string",
      "rank": 1,
      "rationale": "string"
    }
  ],
  "evolutionarySynthesis": "Comprehensive deep-dive narrative explaining the architectural evolution and scaling difference across the solutions.",
  "pedagogicalTakeaway": "Concise key takeaway rule-of-thumb for software engineers."
}`;
}

export interface ComparisonPromptContext {
  problemTitle: string;
  languageA: string;
  codeA: string;
  timeA: number;
  memA: number;
  languageB: string;
  codeB: string;
  timeB: number;
  memB: number;
}

export function buildComparisonPrompt(ctx: ComparisonPromptContext): string {
  return `You are a Senior Systems Architect and Algorithms Expert.
Compare these two valid solutions to the problem "${ctx.problemTitle}".

Solution A (${ctx.languageA}, ${ctx.timeA}ms, ${ctx.memA}KB):
<solution_a>
${ctx.codeA}
</solution_a>

Solution B (${ctx.languageB}, ${ctx.timeB}ms, ${ctx.memB}KB):
<solution_b>
${ctx.codeB}
</solution_b>

INSTRUCTIONS:
1. Contrast their algorithmic paradigms (e.g. Iterative vs Recursive, Hash Table vs Two Pointers, In-place vs Auxiliary memory).
2. Contrast time and space complexity trade-offs.
3. Summarize the architectural evolution from Solution A to Solution B in a pedagogical narrative.
4. Return ONLY a valid JSON object matching the requested schema.`;
}
