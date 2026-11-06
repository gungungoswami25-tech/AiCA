export interface DiagnosticPromptContext {
  problemTitle: string;
  problemDescription: string;
  constraints: string[];
  language: string;
  code: string;
  verdict: string;
  failedTestSummary?: string;
  errorMessage?: string;
}

export function buildDiagnosticPrompt(ctx: DiagnosticPromptContext): string {
  return `You are a Patient and Rigorous Computer Science Educator.
The student submitted code that failed with verdict: ${ctx.verdict}.

Problem: ${ctx.problemTitle}
Language: ${ctx.language}
Verdict: ${ctx.verdict}
${ctx.failedTestSummary ? `Failed Test Context: ${ctx.failedTestSummary}` : ''}
${ctx.errorMessage ? `Error Output: ${ctx.errorMessage}` : ''}

Constraints:
${ctx.constraints.join('\n')}

<untrusted_student_code>
${ctx.code}
</untrusted_student_code>

INSTRUCTIONS:
1. Identify the conceptual or algorithmic flaw causing the failure (${ctx.verdict}).
2. Explain the edge-case vulnerability or state mutation trap that broke the logic.
3. Provide Socratic guidance: ask a thought-provoking question to help the student debug it themselves.
4. CRITICAL RULE: DO NOT provide the complete correct code solution. Do not leak hidden test case values.
5. Determine the asymptotic complexity of the ATTEMPTED algorithm.
6. Return ONLY a valid JSON object matching this schema:
{
  "codeSummary": "Brief overview of the student code",
  "attemptedComplexity": {
    "timeComplexity": "e.g. O(N^2)",
    "spaceComplexity": "e.g. O(1)",
    "explanation": "Rationale of the attempted approach"
  },
  "diagnosticFeedback": {
    "rootCauseBug": "Exact algorithmic flaw or logic bug",
    "edgeCaseVulnerability": "Specific edge case or input condition that failed",
    "socraticHint": "Thought-provoking pedagogical question guiding student to fix it without giving solution away"
  },
  "readabilityScore": 6, // Integer 1-10
  "codeSmells": ["string"]
}`;
}
