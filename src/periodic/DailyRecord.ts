import axios, { Axios } from 'axios';
import { App, TFile, moment, normalizePath } from 'obsidian';
import type { File } from './File';
import {
  type PluginSettings,
  type DailyRecordType,
  type FetchError,
  type ResourceType,
  LogLevel,
} from '../type';
import { ERROR_MESSAGE, MESSAGE } from '../constant';
import {
  formatDailyRecord,
  generateFileName,
  generateHeaderRegExp,
  logMessage,
} from '../util';
import { I18N_MAP } from '../i18n';

export class DailyRecord {
  app: App;
  settings: PluginSettings;
  file: File;
  limit: number;
  lastTime: string;
  offset: number;
  localKey: string;
  locale: string;
  axios: Axios;
  constructor(app: App, settings: PluginSettings, file: File, locale: string) {
    if (!settings.dailyRecordAPI) {
      logMessage(I18N_MAP[this.locale][`${ERROR_MESSAGE}NO_DAILY_RECORD_API`]);
      return;
    }

    if (!settings.dailyRecordToken) {
      logMessage(
        I18N_MAP[this.locale][`${ERROR_MESSAGE}NO_DAILY_RECORD_TOKEN`]
      );
      return;
    }

    if (!settings.dailyRecordHeader) {
      logMessage(
        I18N_MAP[this.locale][`${ERROR_MESSAGE}NO_DAILY_RECORD_HEADER`]
      );
      return;
    }

    this.app = app;
    this.file = file;
    this.settings = settings;
    this.limit = 50;
    this.offset = 0;
    this.localKey = `periodic-para-daily-record-last-time-${this.settings.dailyRecordToken}`;
    this.lastTime = window.localStorage.getItem(this.localKey) || '';
    this.locale = locale;
    this.axios = axios.create({
      headers: {
        Authorization: `Bearer ${this.settings.dailyRecordToken}`
      },
    });
  }
  
  async getMemosVersion() {
    const memosVersion = await this.axios.post(
      `${this.settings.dailyRecordAPI}/memos.api.v1.WorkspaceService/GetWorkspaceProfile`,
      "\u0000\u0000\u0000\u0000\u0000",
      {
        headers:{
          'content-type': 'application/grpc-web+proto',
        'x-grpc-web': '1'
        }
      }
    ).then(response => {
      const data = response.data || "";
      return data.match(/(\d+\.\d+\.\d+)/)[0].replace(" ", "");
    }).catch(error => {
      console.error(error);
      return '';
    });
    window.localStorage.setItem('memos-version', memosVersion);
  }
  
  async fetch() {
    const memosVersion = window.localStorage.getItem('memos-version') || '';
    let config;
    let uri;
    if (memosVersion < '0.22.0') {
      config ={
        params: {
          limit: this.limit,
          offset: this.offset,
          rowStatus: 'NORMAL',
        }
      }
      uri = '/api/v1/memo'
    } else {
      config = {
        params: {
          pageSize: this.limit,
          pageToken: this.offset===0 ? '' : this.offset,
        }
      }
      uri = '/api/v1/memos'
    }
    try {
      let { data } = await this.axios.get<DailyRecordType[] | FetchError>(
        this.settings.dailyRecordAPI+uri,
        config
      );
      if (memosVersion > "0.22.0") {
        this.offset = data.nextPageToken;
        data = data.memos;
        data = data.map((item) => {
          return {
            updatedTs: new Date(item.updateTime).getTime() / 1000,
            createdTs: new Date(item.createTime).getTime() / 1000,
            createdAt: new Date(item.createTime).toISOString(),
            updatedAt: new Date(item.updateTime).toISOString(),
            content: item.content,
            resourceList: item.resources
          };
          })
        }
      if (Array.isArray(data)) {
        return data;
      }
      
      throw new Error(
        data.message || data.msg || data.error || JSON.stringify(data)
      );
    } catch (error) {
      logMessage(
        `${
          I18N_MAP[this.locale][`${ERROR_MESSAGE}DAILY_RECORD_FETCH_FAILED`]
        }: ${error}`,
        LogLevel.error
      );
    }
  }

  forceSync = async () => {
    this.lastTime = '';
    await this.sync();
  };

  sync = async () => {
    logMessage(I18N_MAP[this.locale][`${MESSAGE}START_SYNC_USEMEMOS`]);
    this.offset = 0;
    await this.getMemosVersion();
    await this.downloadResource();
    await this.insertDailyRecord();
  };

  async downloadResource() {
    const { origin } = new URL(this.settings.dailyRecordAPI);
    const memosVersion = window.localStorage.getItem('memos-version') || '';
    let url = origin
    if (memosVersion < '0.22.0') {
      url += '/api/v1/resource'
    } else {
      url += '/api/v1/resources'
    }
    
    try {
      let { data } = await this.axios.get<ResourceType[] | FetchError>(url, {});
      if (memosVersion > "0.22.0") {
        data = data.resources;
      }
      if (Array.isArray(data)) {
        await Promise.all(
          data.map(async (resource) => {
            if (resource.externalLink) {
              return;
            }

            const folder = `${this.settings.periodicNotesPath}/Attachments`;
            const resourcePath = normalizePath(
              `${folder}/${generateFileName(resource)}`
            );

            const isResourceExists = await this.app.vault.adapter.exists(
              resourcePath
            );

            if (isResourceExists) {
              return;
            }
            let resourceURL = ''
            if (memosVersion < '0.22.0') {
              resourceURL = `${origin}/o/r/${
                resource.uid || resource.name || resource.id
              }`;
            } else {
              resourceURL = `${origin}/file/${resource.name}/${resource.filename}`;
            }
            const { data } = await this.axios.get(resourceURL, {responseType: 'arraybuffer',});

            if (!data) {
              return;
            }

            if (!this.app.vault.getAbstractFileByPath(folder)) {
              await this.app.vault.createFolder(folder);
            }

            await this.app.vault.adapter.writeBinary(resourcePath, data);
            console.log(`Downloaded resource: ${resourcePath}`);
          })
        );
        return data;
      }

      throw new Error(
        data.message || data.msg || data.error || JSON.stringify(data)
      );
    } catch (error) {
      if (error.response.status === 404) {
        return;
      }
      logMessage(
        `${
          I18N_MAP[this.locale][`${ERROR_MESSAGE}RESOURCE_FETCH_FAILED`]
        }: ${error}`,
        LogLevel.error
      );
    }
  }

  insertDailyRecord = async () => {
    const memosVersion = window.localStorage.getItem('memos-version') || '';
    const header = this.settings.dailyRecordHeader;
    const dailyRecordByDay: Record<string, Record<string, string>> = {};
    const records = (await this.fetch()) || [];
    const mostRecentTimeStamp = records[0]?.createdAt
      ? moment(records[0]?.createdAt).unix()
      : records[0]?.createdTs;
    
    if (memosVersion< "0.22.0") {
      if (!records.length || mostRecentTimeStamp * 1000 < Number(this.lastTime)) {
        // 直到 record 返回为空，或者最新的一条记录的时间，晚于上一次同步时间
        logMessage(I18N_MAP[this.locale][`${MESSAGE}END_SYNC_USEMEMOS`]);
        
        window.localStorage.setItem(this.localKey, Date.now().toString());
        
        return;
      }
    }
    

    for (const record of records) {
      if (!record.content && !record.resourceList?.length) {
        continue;
      }

      const [date, timeStamp, formattedRecord] = formatDailyRecord(record);

      if (dailyRecordByDay[date]) {
        dailyRecordByDay[date][timeStamp] = formattedRecord;
      } else {
        dailyRecordByDay[date] = {
          [timeStamp]: formattedRecord,
        };
      }
    }

    await Promise.all(
      Object.keys(dailyRecordByDay).map(async (today) => {
        const momentDay = moment(today);
        const link = `${momentDay.year()}/Daily/${String(
          momentDay.month() + 1
        ).padStart(2, '0')}/${momentDay.format('YYYY-MM-DD')}.md`;
        const targetFile = this.file.get(
          link,
          '',
          this.settings.periodicNotesPath
        );

        if (!targetFile && this.settings.dailyRecordWarning) {
          logMessage(
            `${
              I18N_MAP[this.locale][`${ERROR_MESSAGE}NO_DAILY_FILE_EXIST`]
            } ${today}`,
            LogLevel.error
          );
        }
        const reg = generateHeaderRegExp(header);

        if (targetFile instanceof TFile) {
          const originFileContent = await this.app.vault.read(targetFile);
          const regMatch = originFileContent.match(reg);

          if (!regMatch?.length || !regMatch?.index) {
            if (!this.settings.dailyRecordToken) {
              logMessage(
                'Current daily file will not insert daily record due to no daily record header'
              );
              return;
            }

            return;
          }

          const localRecordContent = regMatch[2]?.trim();
          const from = regMatch?.index + regMatch[1].length + 1;
          const to = from + localRecordContent.length;
          const prefix = originFileContent.slice(0, from);
          const suffix = originFileContent.slice(to);
          const localRecordList = localRecordContent
            ? localRecordContent.split(/\n(?=- )/g)
            : [];
          const remoteRecordListWithTime: Record<string, string> = {};
          const localRecordListWithTime: Record<string, string> = {};
          const localRecordWithoutTime: string[] = [];

          for (const record of localRecordList) {
            const regMatch = record.match(/.*\^(\d{10})/);
            const createdTs = regMatch?.length ? regMatch[1]?.trim() : '';

            if (createdTs) {
              remoteRecordListWithTime[createdTs] = record;
            } else if (/^- (\[.*\] )?\d\d:\d\d/.test(record)) {
              // 本地有时间的记录
              const regMatch = record.match(/\d\d:\d\d/);

              if (regMatch) {
                const time = regMatch[0]?.trim();
                const timeStamp = moment(
                  `${today}-${time}`,
                  'YYYY-MM-DD-HH:mm'
                ).unix();

                if (localRecordListWithTime[timeStamp]) {
                  // 避免时间戳重复，导致相互覆盖
                  localRecordListWithTime[timeStamp + 1] = record;
                } else {
                  localRecordListWithTime[timeStamp] = record;
                }
              }
            } else {
              localRecordWithoutTime.push(record);
            }
          }

          const sortedRecordList = Object.entries({
            ...dailyRecordByDay[today],
            ...remoteRecordListWithTime,
            ...localRecordListWithTime,
          })
            .sort((a, b) => {
              const indexA = Number(a[0]);
              const indexB = Number(b[0]);
              return indexA - indexB;
            })
            .map((item) => item[1]);

          const finalRecordContent = localRecordWithoutTime
            .concat(sortedRecordList)
            .join('\n');
          const fileContent =
            prefix.trim() +
            `\n${finalRecordContent}\n\n` +
            suffix.trim() +
            '\n';

          await this.app.vault.modify(targetFile, fileContent);
        }
      })
    );
    if (memosVersion < "0.22.0") {
      this.offset = this.offset + this.limit;
     
    } else {
      if (!this.offset){
        return
      }
    }
    await this.insertDailyRecord();
  };
}
