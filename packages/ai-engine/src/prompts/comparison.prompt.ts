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
