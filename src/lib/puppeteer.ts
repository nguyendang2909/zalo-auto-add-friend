import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

const slowMo = process.env.BROWSER_DELAY_TIME
  ? +process.env.BROWSER_DELAY_TIME
  : 50;

const headless = !!process.env.BROWSER_HEADLESS ? true : false;

export const browserConfig = {
  slowMo,
  headless,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications'],
  ignoreDefaultArgs: ['--enable-automation'],
  defaultViewport: {
    width: 2000,
    height: 900,
  },
};

export const browserDefaultTimeout = process.env.BROWSER_DEFAULT_TIME_OUT
  ? +process.env.BROWSER_DEFAULT_TIME_OUT
  : 10000;

puppeteerExtra.use(StealthPlugin());

export const puppeteer = puppeteerExtra;
