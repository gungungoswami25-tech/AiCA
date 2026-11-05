import { GoogleGenAI } from '@google/genai';
import {
  OptimizationResponseSchema,
  DiagnosticResponseSchema,
  ComparisonResponseSchema,
  ClarificationResponseSchema,
  ProblemGenerationResponseSchema
} from './parsers/ai-response.parser.js';
import { buildOptimizationPrompt, OptimizationPromptContext } from './prompts/optimization.prompt.js';
import { buildDiagnosticPrompt, DiagnosticPromptContext } from './prompts/diagnostic.prompt.js';
import { buildComparisonPrompt, ComparisonPromptContext } from './prompts/comparison.prompt.js';
import { buildClarificationPrompt, buildProblemGenerationPrompt } from './prompts/problem-creator.prompt.js';
import { AIAnalysisReport, SolutionComparison, ProblemProposalGeneratedContent } from '@aica/shared';

export class GeminiAnalysisClient {
  private ai: GoogleGenAI | null = null;
  private modelName: string;

  constructor(apiKey?: string, modelName = 'gemini-1.5-flash') {
    const key = apiKey || process.env.GEMINI_API_KEY;
    this.modelName = modelName;
    if (key && key !== 'your_google_gemini_api_key_here' && key.trim().length > 5) {
      this.ai = new GoogleGenAI({ apiKey: key.trim() });
    }
  }

  private async executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        const isRateLimit =
          err?.status === 429 ||
          err?.message?.includes('429') ||
          err?.message?.includes('Resource has been exhausted');

        if (isRateLimit && attempt < maxRetries) {
          const delayMs = (attempt + 1) * 2000;
          console.warn(`[GeminiClient] Rate limit encountered. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  public async analyzeAcceptedSolution(ctx: OptimizationPromptContext): Promise<Partial<AIAnalysisReport>> {
    if (!this.ai) {
      throw new Error('AI_CONFIG_ERROR: Google Gemini API key is missing. Set GEMINI_API_KEY in environment variables.');
    }

    const prompt = buildOptimizationPrompt(ctx);

    return this.executeWithRetry(async () => {
      const response = await this.ai!.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText);
      const validated = OptimizationResponseSchema.parse(parsed);

      return {
        status: 'COMPLETED',
        mode: 'OPTIMIZATION',
        codeSummary: validated.codeSummary,
        theoreticalComplexity: {
          timeComplexity: validated.timeComplexity,
          spaceComplexity: validated.spaceComplexity,
          explanation: `${validated.timeComplexityExplanation} ${validated.spaceComplexityExplanation}`
        },
        codeQuality: {
          score: validated.readabilityScore,
          readabilityAnalysis: `Readability score ${validated.readabilityScore}/10 based on modular structure and variable semantics.`,
          codeSmells: validated.codeSmells,
          positivePractices: validated.positivePractices
        },
        optimizationSuggestions: validated.optimizationSuggestions,
        generatedAt: new Date().toISOString()
      };
    });
  }

  public async analyzeDiagnosticSolution(ctx: DiagnosticPromptContext): Promise<Partial<AIAnalysisReport>> {
    if (!this.ai) {
      throw new Error('AI_CONFIG_ERROR: Google Gemini API key is missing. Set GEMINI_API_KEY in environment variables.');
    }

    const prompt = buildDiagnosticPrompt(ctx);

    return this.executeWithRetry(async () => {
      const response = await this.ai!.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText);
      const validated = DiagnosticResponseSchema.parse(parsed);

      return {
        status: 'COMPLETED',
        mode: 'DIAGNOSTIC',
        codeSummary: validated.codeSummary,
        theoreticalComplexity: {
          timeComplexity: validated.attemptedComplexity.timeComplexity,
          spaceComplexity: validated.attemptedComplexity.spaceComplexity,
          explanation: validated.attemptedComplexity.explanation
        },
        codeQuality: {
          score: validated.readabilityScore,
          readabilityAnalysis: 'Code analyzed for syntax and architectural clarity.',
          codeSmells: validated.codeSmells,
          positivePractices: []
        },
        diagnosticFeedback: validated.diagnosticFeedback,
        optimizationSuggestions: [],
        generatedAt: new Date().toISOString()
      };
    });
  }

  public async analyzeComparison(ctx: ComparisonPromptContext): Promise<any> {
    if (!this.ai) {
      throw new Error('AI_CONFIG_ERROR: Google Gemini API key is missing. Set GEMINI_API_KEY in environment variables.');
    }

    const prompt = buildComparisonPrompt(ctx);

    return this.executeWithRetry(async () => {
      const response = await this.ai!.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const rawText = response.text || '{}';
      return ComparisonResponseSchema.parse(JSON.parse(rawText));
    });
  }

  public async analyzeClarification(prompt: string): Promise<{
    isClearAndComplete: boolean;
    missingInformationSummary?: string;
    clarifications: Array<{ id: string; question: string; options?: string[] }>;
  }> {
    if (!this.ai) {
      throw new Error('AI_CONFIG_ERROR: Google Gemini API key is missing. Set GEMINI_API_KEY in environment variables.');
    }

    const fullPrompt = buildClarificationPrompt({ prompt });

    return this.executeWithRetry(async () => {
      const response = await this.ai!.models.generateContent({
        model: this.modelName,
        contents: fullPrompt,
        config: { responseMimeType: 'application/json' }
      });

      const parsed = JSON.parse(response.text || '{}');
      return ClarificationResponseSchema.parse(parsed);
    });
  }

  public async generateProblemMaterials(
    prompt: string,
    clarifications?: Record<string, string>
  ): Promise<ProblemProposalGeneratedContent> {
    if (!this.ai) {
      throw new Error('AI_CONFIG_ERROR: Google Gemini API key is missing. Set GEMINI_API_KEY in environment variables.');
    }

    const fullPrompt = buildProblemGenerationPrompt({ prompt, clarifications });

    return this.executeWithRetry(async () => {
      const response = await this.ai!.models.generateContent({
        model: this.modelName,
        contents: fullPrompt,
        config: { responseMimeType: 'application/json' }
      });

      const parsed = JSON.parse(response.text || '{}');
      const validated = ProblemGenerationResponseSchema.parse(parsed);

      return {
        title: validated.title,
        slug: validated.slug,
        difficulty: validated.difficulty,
        tags: validated.tags,
        description: validated.description,
        constraints: validated.constraints,
        examples: validated.examples,
        starterCode: validated.starterCode,
        referenceSolutions: validated.referenceSolutions,
        testCases: validated.testCases.map((tc, idx) => ({
          id: tc.id || `tc-${idx + 1}`,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isPublic: tc.isPublic ?? idx < 2,
          isEdgeCase: tc.isEdgeCase ?? false,
          explanation: tc.explanation,
          weight: 1.0
        }))
      };
    });
  }
}
