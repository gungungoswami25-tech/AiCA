import { Request, Response } from 'express';
import { redisSubscriber } from '../config/db.js';

export function handleSubmissionStatusSSE(req: Request, res: Response): void {
  const submissionId = req.params.id;

  // Set standard SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  res.write(`:connected\n\n`);

  // Setup 15-second heartbeat to prevent proxy timeout
  const heartbeat = setInterval(() => {
    res.write(`:keep-alive\n\n`);
  }, 15000);

  const channel = `submission:${submissionId}`;

  const messageHandler = (chan: string, message: string) => {
    if (chan === channel) {
      try {
        const payload = JSON.parse(message);
        const eventType = payload.pipelineStatus === 'COMPLETED' ? 'complete' : 'status';
        res.write(`event: ${eventType}\n`);
        res.write(`data: ${message}\n\n`);

        if (payload.pipelineStatus === 'COMPLETED' || payload.pipelineStatus === 'FAILED') {
          cleanup();
          res.end();
        }
      } catch {
        res.write(`data: ${message}\n\n`);
      }
    }
  };

  redisSubscriber.subscribe(channel).catch(() => {});
  redisSubscriber.on('message', messageHandler);

  const cleanup = () => {
    clearInterval(heartbeat);
    redisSubscriber.unsubscribe(channel).catch(() => {});
    redisSubscriber.removeListener('message', messageHandler);
  };

  req.on('close', cleanup);
  req.on('end', cleanup);
}
