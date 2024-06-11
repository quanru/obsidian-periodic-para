import { DailyRecordType, FetchError, ResourceType } from '../../type';
import Memos from './MemosBase';

export default class MemosV2 extends Memos {
  async fetchMemosList(params: {
    page: number;
    pageSize: number;
    filter: string;
  }): Promise<DailyRecordType[] | FetchError> {
    const { data } = await this.axios.get('/api/v1/memos', { params });
    return data;
  }

  async fetchResourcesList(): Promise<ResourceType[] | FetchError> {
    const { data } = await this.axios.get('/api/v1/resources');
    return data;
  }

  async downloadResource(id: string): Promise<Buffer> {
    const { data } = await this.axios.get(`/api/v1/resources/${id}`);
    return data;
  }
}