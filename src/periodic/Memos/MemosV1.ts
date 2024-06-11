import { DailyRecordType, FetchError, ResourceType } from '../../type';
import Memos from './MemosBase';

export default class MemosV1 extends Memos {
  async fetchMemosList(params: {
    limit: number;
    offset: number;
    rowStatus: 'NORMAL';
  }): Promise<DailyRecordType[] | FetchError> {
    const { data } = await this.axios.get('/api/v1/memo', { params });
    return data;
  }

  async fetchResourcesList(): Promise<ResourceType[] | FetchError> {
    const { data } = await this.axios.get('/api/v1/resource');
    return data;
  }

  async downloadResource(id: string): Promise<Buffer> {
    const { data } = await this.axios.get(`/o/r/${id}`, {
      responseType: 'arraybuffer',
    });
    return data;
  }
}
