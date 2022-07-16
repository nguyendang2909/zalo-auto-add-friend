import { loggerFactory } from './lib/logger-factory';
import { ZaloService } from './zalo/zalo.service';
import { createTaskQueue } from './lib/queue';
import {
  browserConfig,
  browserDefaultTimeout,
  puppeteer,
} from './lib/puppeteer';

const logger = loggerFactory.getLogger(__filename);

const bootstrap = async () => {
  const browser = await puppeteer.launch(browserConfig);

  const page = await browser.newPage();

  page.setDefaultTimeout(browserDefaultTimeout);

  const zaloService = new ZaloService(browser, page);

  const zaloQueue = createTaskQueue(process.env.ZALO_QUEUE_NAME);

  zaloQueue.process(async (job, done) => {
    try {
      logger.info('Receive message from queue');

      await zaloService.doJob(job.data);
    } catch (err) {
      logger.error(err.stack || err);
    }

    done(null, { message: 'Done job' });
  });

  // * Test
  // const zaloFriendMessage = {
  //   _id: '62952c02018949c0c3122174',
  //   // username: '0812345998',
  //   username: '0971016191',
  //   createdAt: '2022-05-30T20:41:38.488Z',
  //   name: 'Quynh 0812345998 tuần sau gọi lại',
  //   success: false,
  //   updatedAt: '2022-05-30T20:50:05.804Z',
  // };
  // zaloQueue.add(zaloFriendMessage);
  // zaloQueue.add(zaloFriendMessage);
  // Test *
};

bootstrap();
