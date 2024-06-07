import React, { useState, useEffect } from 'react';
import { Switch, Form, Input, Tabs, Typography, Divider, Select } from 'antd';
import { PluginSettings } from '../../type';
import { ConfigProvider } from '../ConfigProvider';
import { DEFAULT_SETTINGS } from '../../view/SettingTab';
import { useApp } from '../../hooks/useApp';

import './index.less';
import { AutoComplete } from '../AutoComplete';

export const SettingTab = (props: {
  settings: PluginSettings;
  saveSettings: (settings: PluginSettings) => void;
}) => {
  const { app, locale } = useApp() || {};
  const { settings, saveSettings } = props;
  const [formValues, setFormValues] = useState(settings);
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

  useEffect(() => {
    setFormValues(settings);
  }, [settings]);

  return (
    <ConfigProvider>
      <Form
        form={form}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={settings}
        onValuesChange={(changedValues) => {
          setFormValues({ ...formValues, ...changedValues });
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
                  <Form.Item
                    help="Turn on Periodic Notes"
                    name="usePeriodicNotes"
                    label="Enable"
                  >
                    <Switch />
                  </Form.Item>

                  {formValues.usePeriodicNotes && (
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
                        help="Where the Habit module is in a daily note"
                        name="habitHeader"
                        label="Habit Header:"
                      >
                        <Input placeholder={DEFAULT_SETTINGS.habitHeader} />
                      </Form.Item>
                      {formValues.usePARANotes && (
                        <>
                          <Form.Item
                            help="Where the Project List is in a daily note"
                            name="projectListHeader"
                            label="Project List Header:"
                          >
                            <Input
                              placeholder={DEFAULT_SETTINGS.projectListHeader}
                            />
                          </Form.Item>
                          <Form.Item
                            help="Where the Area List is in a quarterly note"
                            name="areaListHeader"
                            label="Area List Header:"
                          >
                            <Input
                              placeholder={DEFAULT_SETTINGS.areaListHeader}
                            />
                          </Form.Item>
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
                      {formValues.useDailyRecord && (
                        <>
                          <Form.Item
                            help="Where the Daily Record module is in a daily note"
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
                                'https://your-use-memos.com/api/v1/memo'
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
                          <Form.Item name="dailyRecordVersion" label="Version:">
                            <Select
                              options={[
                                { value: 'v1', label: '<0.22.0' },
                                { value: 'v2', label: '>=0.22.0' },
                              ]}
                            />
                          </Form.Item>
                          <Form.Item
                            help="Warning While Daily Note Not Exist"
                            name="dailyRecordWarning"
                            label="Warning:"
                          >
                            <Switch />
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
                        help="Enable Chinese Calendar"
                        name="useChineseCalendar"
                        label="Chinese Calendar:"
                      >
                        <Switch />
                      </Form.Item>
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
                  <Form.Item
                    help="Turn on PARA Notes"
                    name="usePARANotes"
                    label="Enable"
                  >
                    <Switch />
                  </Form.Item>

                  {formValues.usePARANotes && (
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
                        help="Advanced Settings"
                        name="usePARAAdvanced"
                        label="Enable"
                      >
                        <Switch />
                      </Form.Item>
                      {formValues.usePARAAdvanced && (
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
