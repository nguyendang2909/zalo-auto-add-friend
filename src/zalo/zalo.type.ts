import { Protocol } from 'puppeteer';

export type ZaloQueueMessage = {
  _id?: string;
  username?: string;
  createdAt?: string;
  name?: string;
  success?: boolean;
  updatedAt?: string;
};

// export type AddZaloFriendParams = {
//   username: string;
//   name: string;
// };

export type ZaloFriendData = {
  name?: string;
  username?: string;
  success?: false;
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

export type ZaloAccountData = {
  _id?: string;
  username?: string;
  password?: string;
  cookies: Protocol.Network.CookieParam[];
  friendListLength?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateZaloAccountParams = {
  accountId: string;
  cookies: Protocol.Network.CookieParam[];
};
