export interface OptimizationPromptContext {
  problemTitle: string;
  problemDescription: string;
  constraints: string[];
  language: string;
  code: string;
  executionTimeMs: number;
  memoryKb: number;
}

export function buildOptimizationPrompt(ctx: OptimizationPromptContext): string {
  return `You are a Principal Software Architect and Algorithmic Performance Mentor.
Analyze this ACCEPTED student solution.

Problem: ${ctx.problemTitle}
Language: ${ctx.language}
Execution Time: ${ctx.executionTimeMs} ms
Memory: ${ctx.memoryKb} KB

Constraints:
${ctx.constraints.join('\n')}

<untrusted_student_code>
${ctx.code}
</untrusted_student_code>

INSTRUCTIONS:
1. Provide theoretical asymptotic Big-O time and space complexity with concise mathematical explanations.
2. Evaluate code readability and maintainability on a scale from 1 to 10.
3. Identify positive coding practices and code smells.
4. Suggest 1 to 3 concrete performance or clean-code optimizations with actionable refactored snippets.
5. Return ONLY a valid JSON object matching the requested schema.`;
}
