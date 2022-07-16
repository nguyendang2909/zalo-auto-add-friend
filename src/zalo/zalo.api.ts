import { fetchApi } from '../lib/request-api';
import { UpdateZaloAccountParams, ZaloAccountData } from './zalo.type';

export class ZaloApiService {
  async getAccount(): Promise<ZaloAccountData> {
    return await fetchApi.get<ZaloAccountData>('/public/get-account');
  }

  async updateAccount(
    friendId: string,
    updateZaloAccountParams: UpdateZaloAccountParams,
  ) {
    return await fetchApi.patch(
      `/public/update-status/${friendId}`,
      updateZaloAccountParams,
    );
  }
}

export const zaloApiService = new ZaloApiService();
