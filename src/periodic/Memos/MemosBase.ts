import axios, { AxiosInstance } from 'axios';

export default abstract class Memos {
  protected axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      headers: {
        Accept: 'application/json',
      },
    });
  }

  abstract fetchMemosList(params: any): Promise<any>;
  abstract fetchResourcesList(): Promise<any>;
  abstract downloadResource(id: string): Promise<any>;
}
