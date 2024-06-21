import React, { useState, useEffect } from 'react';
import { Switch, Form, Input, Tabs, Typography, Divider, Select } from 'antd';
import { PluginSettings } from '../../type';
import { ConfigProvider } from '../ConfigProvider';
import { DEFAULT_SETTINGS } from '../../view/SettingTab';
import { useApp } from '../../hooks/useApp';
import {
  PROJECT,
  AREA,
  RESOURCE,
  ARCHIVE,
  DAILY,
  WEEKLY,
  MONTHLY,
  QUARTERLY,
  YEARLY,
} from '../../constant';
import './index.less';
import { AutoComplete } from '../AutoComplete';

export const SettingTab = (props: {
  settings: PluginSettings;
  saveSettings: (settings: PluginSettings) => void;
}) => {
  const { app, locale } = useApp() || {};
  const { settings: initialSettings, saveSettings } = props;
  const [settings, setSetting] = useState(initialSettings);
  const [form] = Form.useForm();
  const folders =
    app?.vault
      .getAllLoadedFiles()
      .filter((file) => !(file as { extension?: string }).extension)
      .map((file) => {
        return {
          label: file.path,
          value: file.path,
        };
      }) || [];
  const files =
    app?.vault
      .getAllLoadedFiles()
      .filter((file) => (file as { extension?: string }).extension === 'md')
      .map((file) => {
        return {
          label: file.path,
          value: file.path,
        };
      }) || [];

  useEffect(() => {
    setSetting(initialSettings);
  }, [initialSettings]);

  return (
    <ConfigProvider>
      <Form
        form={form}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={settings}
        onValuesChange={(changedValues) => {
          setSetting({ ...settings, ...changedValues });
          saveSettings(changedValues);
        }}
      >
        <Tabs
          defaultActiveKey="periodic"
          centered
          items={[
            {
              key: 'periodic',
              label: 'Periodic Notes',
              children: (
                <>
                  <Form.Item name="usePeriodicNotes" label="Turn on">
                    <Switch />
                  </Form.Item>

                  {settings.usePeriodicNotes && (
                    <>
                      <Form.Item
                        name="periodicNotesPath"
                        label="Periodic Notes Folder"
                      >
                        <AutoComplete options={folders}>
                          <Input
                            placeholder={DEFAULT_SETTINGS.periodicNotesPath}
                          />
                        </AutoComplete>
                      </Form.Item>
                      <Form.Item
                        help="Where the habit module is in a daily note"
                        name="habitHeader"
                        label="Habit Header:"
                      >
                        <Input placeholder={DEFAULT_SETTINGS.habitHeader} />
                      </Form.Item>
                      {settings.usePARANotes && (
                        <>
                          <Form.Item
                            help="Where the project list is in a daily note"
                            name="projectListHeader"
                            label="Project List Header:"
                          >
                            <Input
                              placeholder={DEFAULT_SETTINGS.projectListHeader}
                            />
                          </Form.Item>
                          <Form.Item
                            help="Where the area list is in a quarterly note"
                            name="areaListHeader"
                            label="Area List Header:"
                          >
                            <Input
                              placeholder={DEFAULT_SETTINGS.areaListHeader}
                            />
                          </Form.Item>
                        </>
                      )}
                      <Form.Item
                        help="The start day of the week"
                        name="weekStart"
                        label="Week Start:"
                      >
                        <Select
                          options={[
                            {
                              value: -1,
                              label:
                                'Auto' +
                                (locale?.locale === 'zh-cn'
                                  ? '(Monday)'
                                  : '(Sunday)'),
                            },
                            { value: 1, label: 'Monday' },
                            { value: 2, label: 'Tuesday' },
                            { value: 3, label: 'Wednesday' },
                            { value: 4, label: 'Thursday' },
                            { value: 5, label: 'Friday' },
                            { value: 6, label: 'Saturday' },
                            { value: 0, label: 'Sunday' },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item
                        help="Show chinese calendar and holidays"
                        name="useChineseCalendar"
                        label="Chinese Calendar:"
                      >
                        <Switch />
                      </Form.Item>
                      <Form.Item
                        help="Custom template file Path"
                        name="usePeriodicAdvanced"
                        label="Advanced Settings"
                      >
                        <Switch />
                      </Form.Item>
                      {settings.usePeriodicAdvanced && (
                        <>
                          {[DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY].map(
                            (item) => {
                              return (
                                <Form.Item
                                  name={`periodicNotesTemplateFilePath${item}`}
                                  label={`${item} Template`}
                                >
                                  <AutoComplete options={files}>
                                    <Input
                                      placeholder={`${settings.periodicNotesPath}/Templates/${item}.md`}
                                    />
                                  </AutoComplete>
                                </Form.Item>
                              );
                            }
                          )}
                        </>
                      )}
                      <Divider />

                      <Form.Item
                        help={
                          <>
                            Sync daily record from
                            <Typography.Link href="https://usememos.com">
                              {` usememos `}
                            </Typography.Link>
                            service
                          </>
                        }
                        name="useDailyRecord"
                        label="Daily Record"
                      >
                        <Switch />
                      </Form.Item>
                      {settings.useDailyRecord && (
                        <>
                          <Form.Item
                            help="Where the daily record module is in a daily note"
                            name="dailyRecordHeader"
                            label="Header:"
                          >
                            <Input
                              placeholder={DEFAULT_SETTINGS.dailyRecordHeader}
                            />
                          </Form.Item>
                          <Form.Item
                            help={
                              <>
                                The
                                <Typography.Link href="https://usememos.com">
                                  {` usememos `}
                                </Typography.Link>
                                service API
                              </>
                            }
                            name="dailyRecordAPI"
                            label="API:"
                          >
                            <Input
                              placeholder={
                                DEFAULT_SETTINGS.dailyRecordAPI ||
                                'https://your-use-memos.com'
                              }
                            />
                          </Form.Item>
                          <Form.Item
                            help={
                              <>
                                The
                                <Typography.Link href="https://www.usememos.com/docs/security/access-tokens">
                                  {` token `}
                                </Typography.Link>
                                of your API
                              </>
                            }
                            name="dailyRecordToken"
                            label="Token:"
                          >
                            <Input />
                          </Form.Item>
                          <Form.Item
                            help="Warning while daily note not exist"
                            name="dailyRecordWarning"
                            label="Warning:"
                          >
                            <Switch />
                          </Form.Item>
                        </>
                      )}
                    </>
                  )}
                </>
              ),
            },
            {
              key: 'para',
              label: 'PARA Notes',
              children: (
                <>
                  <Form.Item name="usePARANotes" label="Turn on">
                    <Switch />
                  </Form.Item>

                  {settings.usePARANotes && (
                    <>
                      <Form.Item name="projectsPath" label="Projects Folder:">
                        <AutoComplete options={folders}>
                          <Input />
                        </AutoComplete>
                      </Form.Item>
                      <Form.Item name="areasPath" label="Areas Folder:">
                        <AutoComplete options={folders}>
                          <Input />
                        </AutoComplete>
                      </Form.Item>
                      <Form.Item name="resourcesPath" label="Resources Folder:">
                        <AutoComplete options={folders}>
                          <Input />
                        </AutoComplete>
                      </Form.Item>
                      <Form.Item name="archivesPath" label="Archives Folder:">
                        <AutoComplete options={folders}>
                          <Input />
                        </AutoComplete>
                      </Form.Item>
                      <Form.Item
                        help="Custom template file path and index filename"
                        name="usePARAAdvanced"
                        label="Advanced Settings"
                      >
                        <Switch />
                      </Form.Item>
                      {settings.usePARAAdvanced && (
                        <>
                          <Form.Item
                            name="paraIndexFilename"
                            label="Index Filename:"
                          >
                            <Select
                              options={[
                                {
                                  label: 'FolderName.md',
                                  value: 'folderName',
                                },
                                {
                                  label: '*.README.md',
                                  value: 'readme',
                                },
                              ]}
                            />
                          </Form.Item>
                          <>
                            {[
                              [PROJECT, settings.projectsPath],
                              [AREA, settings.areasPath],
                              [RESOURCE, settings.resourcesPath],
                              [ARCHIVE, settings.archivesPath],
                            ].map(([name, path]) => {
                              return (
                                <Form.Item
                                  name={`${name.toLocaleLowerCase()}sTemplateFilePath`}
                                  label={`${name} Template`}
                                >
                                  <AutoComplete options={files}>
                                    <Input
                                      placeholder={`${path}/template.md`}
                                    />
                                  </AutoComplete>
                                </Form.Item>
                              );
                            })}
                          </>
                        </>
                      )}
                    </>
                  )}
                </>
              ),
            },
          ]}
        />
      </Form>
    </ConfigProvider>
  );
};
