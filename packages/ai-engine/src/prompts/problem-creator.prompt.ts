export interface ClarificationPromptContext {
  prompt: string;
}

export function buildClarificationPrompt(ctx: ClarificationPromptContext): string {
  return `You are a Senior Algorithm Designer and Pedagogical Lead for a competitive programming platform.
Evaluate the following coding question proposed by a beginner.

<untrusted_user_input>
${ctx.prompt}
</untrusted_user_input>

INSTRUCTIONS:
1. Determine if this proposal represents a concrete, solvable algorithmic problem.
2. Check for missing critical specifications:
   - What are the input and output types?
   - Are there size constraints on the input ($N$ bounds)?
   - How should edge cases or duplicates be handled?
   - Can inputs be negative, empty, or special characters?
3. If the prompt is missing fundamental information, set "isClearAndComplete" to false, and formulate 1 to 3 targeted multiple-choice clarification questions.
4. If the prompt is clear enough to formulate with standard algorithmic conventions, set "isClearAndComplete" to true and return an empty clarifications array.
5. Return ONLY a valid JSON object matching the Clarification schema.`;
}

export interface ProblemGenerationPromptContext {
  prompt: string;
  clarifications?: Record<string, string>;
}

export function buildProblemGenerationPrompt(ctx: ProblemGenerationPromptContext): string {
  const clarificationNotes = ctx.clarifications
    ? Object.entries(ctx.clarifications)
        .map(([id, answer]) => `- ${id}: ${answer}`)
        .join('\n')
    : 'None provided.';

  return `You are a Principal Software Architect and Master Problem Author for a CodeChef/LeetCode-style evaluation platform.
Transform the following beginner's question into a production-grade algorithmic coding challenge.

<untrusted_user_prompt>
${ctx.prompt}
</untrusted_user_prompt>

User Clarification Answers:
${clarificationNotes}

INSTRUCTIONS:
1. Generate a professional Title and URL-safe lowercase slug (e.g., "first-unique-character").
2. Classify difficulty strictly as "EASY", "MEDIUM", or "HARD".
3. Provide relevant algorithmic tags (e.g., ["Arrays", "Hash-Table"]).
4. Formulate a clear, elegant Markdown Description explaining the mathematical/computational task clearly without ambiguity.
5. Explicitly state mathematical Constraints (e.g., "1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9").
6. Provide 2 to 3 detailed Examples with step-by-step Explanations.
7. Provide clean starter code in Python, JavaScript, C++, and Java with proper standard I/O or function signature.
8. CRITICAL - DUAL REFERENCE SOLUTIONS FOR DIFFERENTIAL TESTING:
   - "canonicalPython": The optimal reference solution in Python 3.11 (e.g. using hash map or dynamic programming). Must read from sys.stdin and print to sys.stdout.
   - "secondaryOracle": An independent, clean secondary solution (e.g. in Python or C++) using an alternative or simpler brute-force/procedural algorithm to act as an independent differential test oracle.
9. TEST SUITE:
   Generate between 10 to 14 diverse test cases:
   - 2 Public sample cases (isPublic: true).
   - 4 Standard hidden test cases (isPublic: false, isEdgeCase: false).
   - 4 Boundary & Edge test cases (isPublic: false, isEdgeCase: true) covering empty arrays, single elements, negative bounds, identical values.
   - 2 Large stress cases to verify time complexity boundaries.
10. Ensure input strings match standard line-separated format (e.g. array length, then array elements, then target).
11. Return ONLY a valid JSON object strictly adhering to the ProblemGeneration schema.`;
}
