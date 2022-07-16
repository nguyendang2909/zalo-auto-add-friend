import Bull, { QueueOptions } from 'bull';
import { loggerFactory } from './logger-factory';

const logger = loggerFactory.getLogger(__filename);

export const createTaskQueue = (name) => {
  const queueOption: QueueOptions = {
    redis: {
      host: process.env.QUEUE_HOST || 'localhost',
      port: parseInt(process.env.QUEUE_PORT || '') || 6379,
    },
    settings: {
      lockDuration:
        parseInt(process.env.QUEUE_BLOCK_TIME || '', 10) || 30 * 60 * 1000,
      maxStalledCount: 0,
    },
  };

  if (process.env.QUEUE_USER && queueOption.redis) {
    queueOption.redis.username = process.env.QUEUE_USER;
    queueOption.redis.password = process.env.QUEUE_PASSWORD;
  }

  const queue = new Bull(name, queueOption);

  queue.on('stalled', async (job) => {
    logger.warn(`job with id: ${job.id} stalled, ${job.failedReason}`);

    // reportStream('warn', job with id: ${job.id} stalled, ${job.failedReason});
    await job.remove();
  });

  queue.on('failed', async (job) => {
    // reportStream('warn', job with id: ${job.id} failed, ${job.failedReason});

    logger.warn(`job with id: ${job.id} failed, ${job.failedReason}`);
    await job.remove();
  });

  return queue;
};
