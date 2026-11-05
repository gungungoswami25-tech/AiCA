# 🛡️ AI Coding Standards & Branch Protection Rules

> **MANDATORY READING FOR ALL DEVELOPERS & AI ASSISTANTS (Cursor, Claude, Copilot, Windsurf, Trae)**

This project enforces strict standards to ensure that AI-assisted coding results in **clean, human-grade, production-quality code** rather than fragile AI slop, and guarantees that **no one can accidentally break the `main` production branch**.

---

## 🚫 1. Absolute Rule: Direct Push to `main` is STRICTLY FORBIDDEN

Neither a human developer nor an AI coding agent is allowed to execute `git push origin main`.

### How This is Enforced:
1. **Local Git Hook Protection (`.githooks/pre-push`):**
   - Automatically installed when running `pnpm install`.
   - If anyone runs `git push origin main`, the terminal will immediately reject the push with an error message:
     ```
     ================================================================================
     🚨 [AICA GUARD] DIRECT PUSH TO 'main' IS STRICTLY BLOCKED!
     ================================================================================
     👉 Kripya ek feature branch banayein aur usme push karein:
          1. git checkout -b feat/your-feature-name
          2. git commit -m "feat: description of work"
          3. git push origin feat/your-feature-name
     ================================================================================
     ```
2. **GitHub Branch Protection (Server-Side):**
   - Direct push to `main` is blocked on GitHub. All code must go through a **Pull Request (PR)**.

---

## 🤖 2. Prompting Rules for Developers Using AI Coding Assistants

Whenever you give a task to Cursor, Copilot, ChatGPT, or Claude, **always paste this instruction at the start of your prompt**:

```text
Follow the guidelines in .cursorrules and CLAUDE.md.
Rules:
1. Do NOT touch or push to the 'main' branch. Create a feature branch feat/<name>.
2. Write clean, human-like, fully-typed TypeScript code (No 'any', no empty TODO stubs).
3. Reuse schemas and types from @aica/shared.
4. Run 'pnpm build' and 'pnpm test' to verify that all code compiles and tests pass before committing.
```

---

## 👨‍💻 3. Human-Grade Code Quality Guidelines (How to Code Like a Senior Engineer)

When AI generates code, make sure it adheres to these 5 quality standards before approving:

### 1. No "AI Slop" or Unimplemented Stubs:
❌ **Bad (AI Slop):**
```typescript
// TODO: Implement user verification logic later
function checkUser() {
  return true;
}
```
✅ **Good (Human-Grade):**
```typescript
/**
 * Verifies that the user account is active and has permission to submit solutions.
 * Throws 403 Forbidden if suspended or unverified.
 */
export async function verifyUserEligibility(userId: string): Promise<User> {
  const user = await userRepository.findById(userId);
  if (!user || user.status !== 'ACTIVE') {
    throw new DomainError('ACCOUNT_SUSPENDED', 'User account is not eligible for submissions');
  }
  return user;
}
```

### 2. Strict Type Safety (Zero `any` Policy):
- Never use `any`, `unknown` without type guards, or `as any`.
- Use the shared interfaces in `packages/shared/src/types/`:
  - `Problem`, `Submission`, `EvaluationReport`, `ComparisonResult`, `UserRole`, `Verdict`.
- If a new type is needed, define it in `packages/shared` and run `pnpm --filter @aica/shared build`.

### 3. Meaningful, Descriptive Identifiers:
- Variable and function names must explain *intent*:
  - Good: `isExecutionTimeout`, `languageMultiplier`, `calculateCompositeScore`
  - Bad: `res`, `flag`, `tempData`, `val1`, `foo`

### 4. Meaningful Comments:
- Don't explain *what* the syntax is doing (`// loops through array`).
- Explain *why* a particular engineering tradeoff was made (`// Cap submission rate at 10 requests per minute to prevent Judge0 queue starvation`).

### 5. Standardized API Responses:
- Never return arbitrary JSON from Express controllers. Always use the standard envelopes:
  ```typescript
  res.status(200).json(createSuccessResponse(data, 'Optional message'));
  res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Message', details));
  ```

---

## 🔒 4. How to Enable GitHub Branch Protection on `main` (30 Seconds Setup)

As the repository owner, enable this in GitHub so nobody can bypass the rule:

1. Open your GitHub Repository: `https://github.com/mohankunjam25-hue/AiCA`
2. Go to **Settings** (top right tab) -> **Branches** (left menu).
3. Under "Branch protection rules", click **"Add rule"** (or "Add branch ruleset").
4. In **Branch name pattern**, enter: `main`.
5. Check these 3 checkboxes:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging**
   - ✅ **Do not allow bypassing the above settings**
6. Click **"Create"** or **"Save changes"**.

🎉 Now your `main` branch is 100% protected on GitHub, locally, and inside every AI tool!
