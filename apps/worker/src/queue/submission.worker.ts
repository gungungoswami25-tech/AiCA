import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import mongoose from 'mongoose';
import { Judge0Service } from '../services/judge0.service.js';
import { TestEvaluatorService } from '../services/test-evaluator.js';
import { ScoringService } from '../services/scoring.service.js';
import { GeminiAnalysisClient } from '@aica/ai-engine';
import { PipelineStatus, Verdict, SupportedLanguage, sanitizeRedisUrl } from '@aica/shared';

// Initialize Services with TLS support & URL sanitization
const redisUrl = sanitizeRedisUrl(process.env.REDIS_URL);
const isRedisTls = redisUrl.startsWith('rediss://');
const redisOptions = {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  connectTimeout: 4000,
  retryStrategy(times: number) {
    if (times > 3) return null;
    return Math.min(times * 300, 1000);
  },
  ...(isRedisTls ? { tls: { rejectUnauthorized: false } } : {})
};

function createSafeRedis(url: string, opts: any): Redis {
  try {
    return new Redis(url, opts);
  } catch (err: any) {
    console.warn('[SubmissionWorker] Warning: Error initializing Redis URL, falling back safely:', err.message);
    return new Redis('redis://localhost:6379', { ...opts, lazyConnect: true });
  }
}

const redisPublisher = createSafeRedis(redisUrl, redisOptions);
redisPublisher.on('error', (err) => {
  console.warn('[SubmissionWorker] Redis publisher warning (deferred):', err.message);
});

const judge0 = new Judge0Service();
const aiClient = new GeminiAnalysisClient();

// Helper to publish live SSE progress events
async function publishProgress(
  submissionId: string,
  pipelineStatus: PipelineStatus,
  verdict: Verdict,
  step: number,
  totalSteps = 4,
  extra: Record<string, any> = {}
) {
  try {
    const payload = JSON.stringify({
      submissionId,
      pipelineStatus,
      verdict,
      step,
      totalSteps,
      ...extra
    });
    await redisPublisher.publish(`submission:${submissionId}`, payload);
  } catch (err: any) {
    console.warn('[SubmissionWorker] PubSub publish error:', err.message);
  }
}

export function startSubmissionWorker(): Worker {
  const connection = createSafeRedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: 4000,
    retryStrategy(times: number) {
      if (times > 3) return null;
      return Math.min(times * 300, 1000);
    },
    ...(isRedisTls ? { tls: { rejectUnauthorized: false } } : {})
  });

  connection.on('error', (err) => {
    console.warn('[SubmissionWorker] Redis connection warning (deferred):', err.message);
  });

  redisPublisher.connect().catch(() => {});

  const worker = new Worker(
    'submission-queue',
    async (job: Job) => {
      const { submissionId, problemId, userId, username, language, languageId, code, isTestRun } = job.data;
      console.log(`[SubmissionWorker] Processing submission ${submissionId} (Language: ${language})`);

      const db = mongoose.connection;
      const submissionsCol = db.collection('submissions');
      const problemsCol = db.collection('problems');
      const reportsCol = db.collection('evaluation_reports');

      try {
        // Step 1: Compiling Stage
        await publishProgress(submissionId, 'COMPILING', 'PENDING', 1, 4);
        await submissionsCol.updateOne(
          { _id: new mongoose.Types.ObjectId(submissionId) },
          { $set: { pipelineStatus: 'COMPILING' } }
        );

        // Fetch problem and test suite
        const problem = await problemsCol.findOne({ _id: new mongoose.Types.ObjectId(problemId) });
        if (!problem) {
          throw new Error(`Problem ${problemId} not found`);
        }

        // For test runs (Run Code), only evaluate public test cases; for official submits, evaluate all
        const testCases = (problem.testCases || []).filter((tc: any) => (isTestRun ? tc.isPublic === true : true));

        // Step 2: Executing Tests Stage
        await publishProgress(submissionId, 'EXECUTING', 'PENDING', 2, 4);
        await submissionsCol.updateOne(
          { _id: new mongoose.Types.ObjectId(submissionId) },
          { $set: { pipelineStatus: 'EXECUTING' } }
        );

        // Determine language-specific time limit multiplier
        const langMultiplier =
          language === 'python'
            ? (problem.benchmarks?.pythonMultiplier || 4.0)
            : language === 'javascript'
            ? (problem.benchmarks?.jsMultiplier || 2.5)
            : language === 'java'
            ? (problem.benchmarks?.javaMultiplier || 2.0)
            : (problem.benchmarks?.cppMultiplier || 1.0);

        const scaledTimeLimitMs = Math.round((problem.timeLimitMs || 2000) * langMultiplier);

        // Prepare batch for Judge0
        const batchInputs = testCases.map((tc: any, idx: number) => ({
          testCaseId: tc.id,
          index: idx + 1,
          isPublic: Boolean(tc.isPublic),
          sourceCode: code,
          languageId: languageId || 71,
          stdin: tc.input,
          expectedOutput: tc.expectedOutput,
          cpuTimeLimit: scaledTimeLimitMs,
          memoryLimit: problem.memoryLimitKb
        }));

        const submittedTokens = await judge0.submitBatch(batchInputs);
        const tokenList = submittedTokens.map((t) => t.token);

        // Poll results from Judge0
        const judge0Results = await judge0.pollBatchResults(tokenList);

        // Evaluate outputs using Deterministic Diff Engine
        const tokenMappings = submittedTokens.map((t, idx) => ({
          ...t,
          expectedOutput: testCases[idx].expectedOutput
        }));

        const outcome = TestEvaluatorService.evaluateBatch(tokenMappings, judge0Results);

        // Step 3: AI Analysis Stage (for syntactically valid code)
        let aiReportPartial: any = {
          status: 'SKIPPED',
          mode: 'OPTIMIZATION',
          codeSummary: 'Compilation failed. AI analysis bypassed.',
          theoreticalComplexity: { timeComplexity: 'N/A', spaceComplexity: 'N/A', explanation: '' },
          codeQuality: { score: 1, readabilityAnalysis: '', codeSmells: [], positivePractices: [] },
          optimizationSuggestions: []
        };

        if (outcome.verdict !== 'COMPILATION_ERROR') {
          await publishProgress(submissionId, 'ANALYZING_AI', outcome.verdict, 3, 4);
          await submissionsCol.updateOne(
            { _id: new mongoose.Types.ObjectId(submissionId) },
            { $set: { pipelineStatus: 'ANALYZING_AI', verdict: outcome.verdict } }
          );

          if (outcome.verdict === 'ACCEPTED') {
            aiReportPartial = await aiClient.analyzeAcceptedSolution({
              problemTitle: problem.title,
              problemDescription: problem.description,
              constraints: problem.constraints || [],
              language,
              code,
              executionTimeMs: outcome.maxExecutionTimeMs,
              memoryKb: outcome.maxMemoryKb
            });
          } else {
            // Mode B: Diagnostic analysis for incorrect solutions (WA, TLE, RE)
            aiReportPartial = await aiClient.analyzeDiagnosticSolution({
              problemTitle: problem.title,
              problemDescription: problem.description,
              constraints: problem.constraints || [],
              language,
              code,
              verdict: outcome.verdict,
              failedTestSummary: `Failed with ${outcome.verdict} on test evaluation. Passed ${outcome.passedCount}/${outcome.totalCount} test cases.`,
              errorMessage: outcome.compileOutput
            });
          }
        }

        // Step 4: Scoring & Normalization
        const scoring = ScoringService.calculate({
          verdict: outcome.verdict,
          passedCount: outcome.passedCount,
          totalCount: outcome.totalCount,
          language: language as SupportedLanguage,
          executionTimeMs: outcome.maxExecutionTimeMs,
          memoryUsedKb: outcome.maxMemoryKb,
          aiQualityScore: aiReportPartial?.codeQuality?.score || 7.5,
          targetTimeMs: problem.benchmarks?.targetTimeMs || 15,
          timeLimitMs: problem.timeLimitMs,
          memoryLimitKb: problem.memoryLimitKb
        });

        // Persist Evaluation Report Document in MongoDB
        const reportInsert = await reportsCol.insertOne({
          submissionId,
          userId,
          username,
          problemId,
          verdict: outcome.verdict,
          pipelineStatus: 'COMPLETED',
          summary: `Evaluated ${outcome.totalCount} test cases. Verdict: ${outcome.verdict}.`,
          aiAnalysis: aiReportPartial,
          metrics: {
            rawTimeMs: outcome.maxExecutionTimeMs,
            normalizedTimeMs: scoring.normalizedTimeMs,
            rawMemoryKb: outcome.maxMemoryKb,
            normalizedMemoryKb: scoring.normalizedMemoryKb,
            compositeScore: scoring.compositeScore,
            percentileTime: 85,
            percentileMemory: 80
          },
          createdAt: new Date().toISOString()
        });

        const reportId = reportInsert.insertedId.toString();

        // Update Submission Record with final outcome
        await submissionsCol.updateOne(
          { _id: new mongoose.Types.ObjectId(submissionId) },
          {
            $set: {
              pipelineStatus: 'COMPLETED',
              verdict: outcome.verdict,
              executionTimeMs: outcome.maxExecutionTimeMs,
              memoryUsedKb: outcome.maxMemoryKb,
              normalizedTimeMs: scoring.normalizedTimeMs,
              compositeScore: scoring.compositeScore,
              compileOutput: outcome.compileOutput,
              testCasesTotal: outcome.totalCount,
              testCasesPassed: outcome.passedCount,
              testResults: outcome.testResults,
              evaluationReportId: reportId,
              updatedAt: new Date()
            }
          }
        );

        // Update Leaderboard Redis Sorted Set if Accepted
        if (outcome.verdict === 'ACCEPTED' && !isTestRun) {
          const zsetKey = `leaderboard:problem:${problemId}`;
          await redisPublisher.zadd(zsetKey, scoring.compositeScore, submissionId);
        }

        // Step 5: Complete & Publish final SSE event
        await publishProgress(submissionId, 'COMPLETED', outcome.verdict, 4, 4, {
          reportId,
          compositeScore: scoring.compositeScore
        });

        console.log(
          `[SubmissionWorker] Completed submission ${submissionId}: ${outcome.verdict} (Score: ${scoring.compositeScore})`
        );
      } catch (err: any) {
        console.error(`[SubmissionWorker] Error evaluating submission ${submissionId}:`, err.message);
        await submissionsCol.updateOne(
          { _id: new mongoose.Types.ObjectId(submissionId) },
          {
            $set: {
              pipelineStatus: 'FAILED',
              verdict: 'INTERNAL_ERROR',
              updatedAt: new Date()
            }
          }
        );
        await publishProgress(submissionId, 'FAILED', 'INTERNAL_ERROR', 4, 4, {
          error: err.message
        });
      }
    },
    { connection, concurrency: 5 }
  );

  return worker;
}
