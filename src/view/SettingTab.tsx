import React from 'react';
import { PluginSettingTab } from 'obsidian';
import type { App } from 'obsidian';
import type LifeOS from '../main';
import type { PluginSettings } from '../type';
import { type Root, createRoot } from 'react-dom/client';
import { AppContext } from '../context';
import { SettingTab } from '../component/SettingTab';
import { Locale } from 'antd/es/locale';

export const DEFAULT_SETTINGS: PluginSettings = {
  periodicNotesPath: 'PeriodicNotes',
  projectsPath: '1. Projects',
  areasPath: '2. Areas',
  resourcesPath: '3. Resources',
  archivesPath: '4. Archives',
  projectListHeader: 'Project List',
  areaListHeader: 'First Things Dimension',
  habitHeader: 'Habit',
  dailyRecordHeader: 'Daily Record',
  dailyRecordAPI: '',
  dailyRecordToken: '',
  dailyRecordVersion: 'v1',
  dailyRecordWarning: true,
  useDailyRecord: false,
  usePeriodicNotes: true,
  usePARANotes: true,
  usePARAAdvanced: false,
  paraIndexFilename: 'readme',
  weekStart: -1,
  useChineseCalendar: false,
};

export class SettingTabView extends PluginSettingTab {
  plugin: LifeOS;
  root: Root;
  settings: PluginSettings;
  locale: Locale;

  constructor(
    app: App,
    settings: PluginSettings,
    plugin: LifeOS,
    locale: Locale
  ) {
    super(app, plugin);
    this.settings = settings;
    this.plugin = plugin;
    this.locale = locale;
  }

  display(): void {
    this.containerEl.empty();
    this.containerEl.addClass('periodic-para-setting-tab');
    this.root = createRoot(this.containerEl);

    // 保存设置的函数
    const saveSettings = (newSettings: PluginSettings) => {
      this.settings = { ...this.settings, ...newSettings };
      this.plugin.saveSettings(this.settings);
      const event = new CustomEvent('settingUpdate', {
        detail: this.settings,
      });
      document.dispatchEvent(event);
    };

    this.root.render(
      <AppContext.Provider
        value={{
          app: this.app,
          settings: this.settings,
          locale: this.locale,
        }}
      >
        <SettingTab settings={this.settings} saveSettings={saveSettings} />
      </AppContext.Provider>
    );
  }

  async hide() {
    super.hide();
    this.root.unmount();
  }
}
