import { Browser, Page } from 'puppeteer';
import { loggerFactory } from '../lib/logger-factory';
import { ZaloAccountData, ZaloQueueMessage } from './zalo.type';
import _ from 'lodash';
import { zaloApiService } from './zalo.api';
import {
  browserConfig,
  browserDefaultTimeout,
  puppeteer,
} from '../lib/puppeteer';

const logger = loggerFactory.getLogger(__filename);

export class ZaloService {
  zaloAccount?: ZaloAccountData;
  page: Page;
  browser: Browser;

  constructor(browser: Browser, page: Page) {
    this.page = page;

    this.browser = browser;
  }

  async doJob(zaloFriendMessage: ZaloQueueMessage) {
    if (
      !zaloFriendMessage ||
      !zaloFriendMessage.username ||
      !zaloFriendMessage._id ||
      !zaloFriendMessage.name
    ) {
      logger.error('Message is not correct');

      return;
    }

    const zaloAccount = await zaloApiService.getAccount();

    await this.page.goto('https://chat.zalo.me', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    if (!this.zaloAccount?.username) {
      await this.login(zaloAccount);
    } else if (this.zaloAccount.username === zaloAccount.username) {
      try {
        await this.page.waitForSelector('div[data-id="btn_Main_AddFrd"]', {
          timeout: 5000,
        });
      } catch (err) {
        await this.login(zaloAccount);
      }
    } else {
      logger.debug('Start switch account');

      await this.switchBrowser();

      await this.login(zaloAccount);
    }

    // Click makeFriend button
    const makeFriendButton = await this.page.waitForSelector(
      'div[data-id="btn_Main_AddFrd"]',
    );

    if (!makeFriendButton) {
      throw new Error('Not found make friend button');
    }

    await makeFriendButton.click();

    logger.debug('Clicked to make friend');

    await this.changeCountryToVietnam();

    await this.findFriend(zaloFriendMessage.username);

    await this.setContactName(zaloFriendMessage.name);

    const addFriend = await this.addFriend();

    // // Get new cookie and store in to db
    if (!!addFriend && zaloAccount._id) {
      await this.updateAccount(zaloFriendMessage._id, zaloAccount._id);
    }
  }

  async login(zaloAccount: ZaloAccountData) {
    const { cookies, password, username } = zaloAccount;

    if (!cookies || !cookies || !password) {
      throw new Error('Account data is not correct');
    }

    await this.page.goto('about:blank', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    this.zaloAccount = zaloAccount;

    const client = await this.page.target().createCDPSession();

    await client.send('Network.clearBrowserCookies');

    await client.send('Network.clearBrowserCache');

    await this.page.setCookie(...cookies);

    await this.page.goto('https://chat.zalo.me', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await this.page.waitForSelector('div[class="body"] ul li');

    const loginTabs = await this.page.$$('div[class="body"] ul li');

    if (!loginTabs) {
      throw new Error('Not found login tabs');
    }

    await loginTabs[1].click();

    const passwordInput = await this.page.waitForSelector(
      'input[type="password"]',
    );

    if (!passwordInput) {
      throw new Error('Not found password input');
    }

    await passwordInput.type(password);

    await this.page.click('a[tabindex]');

    await this.page.waitForSelector('nav[id="sidebarNav"]');

    logger.debug(`Login to Zalo successfully with account "${username}"`);
  }

  async changeCountryToVietnam() {
    try {
      const countryInput = await this.page.waitForSelector(
        'div[class~="phone-iso-picker"]',
      );

      if (!countryInput) {
        throw new Error('Not found country input');
      }

      const countryCode = await (
        await countryInput.getProperty('innerText')
      ).jsonValue();

      if (!_.isString(countryCode)) {
        throw new Error('Cannot select country');
      }

      if (!countryCode.includes('+84')) {
        await countryInput.click();

        const vietnamOption = await this.page.waitForSelector(
          'span[title="Vietnam"]',
        );

        if (!vietnamOption) {
          throw new Error('Cannot select vietnam option');
        }

        await vietnamOption.click();

        logger.debug('Select Vietnam country code +84');
      }
    } catch (err) {
      logger.warn('Cannot select country Vietnam', err.stack || err.message);
    }
  }

  async findFriend(username: string) {
    const phoneNumberInput = await this.page.waitForSelector(
      'input[data-id="txt_Main_AddFrd_Phone"]',
    );

    if (!phoneNumberInput) {
      throw new Error('Not found phone number input');
    }

    await phoneNumberInput.type(username);

    await this.page.waitForTimeout(1000);

    const searchButton = await this.page.waitForSelector(
      'div[data-translate-inner="STR_SEARCH"]',
    );

    if (!searchButton) {
      throw new Error('Not found search button');
    }

    await searchButton.click();

    logger.debug(`Clicked to find friend "${username}"`);

    try {
      await this.page.waitForSelector(
        'div[data-id="btn_UserProfile_EditAlias"]',
      );
    } catch (err) {
      throw new Error('This friend username could not be found');
    }
  }

  async setContactName(name: string) {
    // Set contact name
    try {
      const editContactButton = await this.page.waitForSelector(
        'div[data-id="btn_UserProfile_EditAlias"]',
      );

      if (!editContactButton) {
        throw new Error('Not found edit contact button');
      }

      await editContactButton.click();

      const contactNameInput = await this.page.waitForSelector(
        'input[data-id="txt_AliasPopup_Alias"]',
      );

      if (!contactNameInput) {
        throw new Error('Not found contact name input');
      }

      await contactNameInput.type(name);

      const setContactNameButton = await this.page.waitForSelector(
        'div[data-translate-inner="STR_CONFIRM"]',
      );

      if (!setContactNameButton) {
        throw new Error('Not found contact name input');
      }

      await setContactNameButton.click();

      logger.debug(`Set conntact name is "${name}"`);
    } catch (err) {
      logger.warn('Cannot set zalo contact name', err.stack || err.message);
    }
  }

  async addFriend(): Promise<boolean> {
    // Add friend
    try {
      // Click "Ket ban"
      const addFriendButton = await this.page.waitForSelector(
        'div[data-id="btn_UserProfile_AddFrd"]',
      );

      if (!addFriendButton) {
        throw new Error('Not found add friend button');
      }

      await addFriendButton.click();

      // Click the last "Ket ban"
      const lastAddFriendButton = await this.page.waitForSelector(
        'div[data-id="btn_AddFrd_Add"]',
      );

      if (!lastAddFriendButton) {
        throw new Error('Not found last add friend button');
      }

      await lastAddFriendButton.click();

      await this.page.waitForSelector('.toast');

      logger.info('Add friend successfully');

      return true;
    } catch (err) {
      try {
        await this.page.waitForSelector(
          'div[data-id="btn_UserProfile_CXLFrdReq"]',
        );

        logger.info('Friend added before');

        return false;
      } catch (error) {
        logger.error('Add friend not successfully');

        throw error;
      }
    }
  }

  async updateAccount(friendId: string, accountId: string) {
    const client = await this.page.target().createCDPSession();

    const cookiesInZaloPage = (await client.send('Network.getAllCookies'))
      .cookies;

    await zaloApiService.updateAccount(friendId, {
      accountId: accountId,
      cookies: cookiesInZaloPage,
    });

    logger.info('Update account successfully');
  }

  async switchBrowser() {
    this.browser.close();

    this.browser = await puppeteer.launch(browserConfig);

    this.page = await this.browser.newPage();

    this.page.setDefaultTimeout(browserDefaultTimeout);
  }
}
