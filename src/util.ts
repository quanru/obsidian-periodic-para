import { Component, MarkdownRenderer, Notice, TFile, moment } from 'obsidian';
import type { App } from 'obsidian';
import dayjs, { Dayjs } from 'dayjs';
import type {
  DailyRecordType,
  PeriodicNotesTemplateFilePath,
  ResourceType,
} from './type';
import { LogLevel, PluginSettings } from './type';
import {
  DAILY,
  WEEKLY,
  MONTHLY,
  QUARTERLY,
  YEARLY,
  LIFE_OS_OFFICIAL_SITE,
  ERROR_MESSAGE,
} from './constant';
import { I18N_MAP } from './i18n';

export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function renderError(
  app: App,
  msg: string,
  containerEl: HTMLElement,
  sourcePath: string
) {
  const component = new Component();

  return MarkdownRenderer.render(app, msg, containerEl, sourcePath, component);
}

export async function createFile(
  app: App,
  options: {
    locale: string;
    templateFile: string;
    folder: string;
    file: string;
    tag?: string;
  }
) {
  if (!app) {
    return;
  }

  const { templateFile, folder, file, tag, locale } = options;
  const templateTFile = app.vault.getAbstractFileByPath(templateFile!);
  const finalFile = file.match(/\.md$/) ? file : `${file}.md`;

  if (!templateTFile) {
    return new Notice(
      I18N_MAP[locale][`${ERROR_MESSAGE}NO_TEMPLATE_EXIST`] + templateFile
    );
  }

  if (templateTFile instanceof TFile) {
    const templateContent = await app.vault.cachedRead(templateTFile);

    if (!folder || !finalFile) {
      return;
    }

    const tFile = app.vault.getAbstractFileByPath(finalFile);

    if (tFile && tFile instanceof TFile) {
      return await app.workspace.getLeaf().openFile(tFile);
    }

    if (!app.vault.getAbstractFileByPath(folder)) {
      app.vault.createFolder(folder);
    }

    const fileCreated = await app.vault.create(finalFile, templateContent);

    await app.fileManager.processFrontMatter(fileCreated, (frontMatter) => {
      if (!tag) {
        return;
      }

      frontMatter.tags = frontMatter.tags || [];
      frontMatter.tags.push(tag.replace(/^#/, ''));
    });
    await sleep(30); // 等待被索引，否则读取不到 frontmatter：this.app.metadataCache.getFileCache(file)
    await app.workspace.getLeaf().openFile(fileCreated);
  }
}

export function isDarkTheme() {
  const el = document.querySelector('body');
  return el?.className.split(' ').includes('theme-dark') ?? false;
}

export function isBulletList(content: string) {
  return /^([-*\u2022]|\d+\.) .*/.test(content);
}

export function formatDailyRecord(record: DailyRecordType) {
  const { createdTs, createdAt, content, resourceList } = record;
  const timeStamp = createdAt ? moment(createdAt).unix() : createdTs;
  const [date, time] = moment(timeStamp * 1000)
    .format('YYYY-MM-DD HH:mm')
    .split(' ');
  const [firstLine, ...otherLine] = content.trim().split('\n');
  const isTask = /^- \[.*?\]/.test(firstLine); // 目前仅支持 task
  const isCode = /```/.test(firstLine);

  let targetFirstLine = '';

  if (isTask) {
    targetFirstLine = `- [ ] ${time} ${firstLine.replace(/^- \[.*?\]/, '')}`;
  } else if (isCode) {
    targetFirstLine = `- ${time}`; // 首行不允许存在代码片段
    otherLine.unshift(firstLine);
  } else {
    targetFirstLine = `- ${time} ${firstLine.replace(/^- /, '')}`;
  }

  targetFirstLine += ` #daily-record ^${timeStamp}`;

  const targetOtherLine = otherLine?.length //剩余行
    ? '\n' +
      otherLine
        .filter((line: string) => line.trim())
        .map((line: string) => `\t${isBulletList(line) ? line : `- ${line}`}`)
        .join('\n')
        .trimEnd()
    : '';
  const targetResourceLine = resourceList?.length // 资源文件
    ? '\n' +
      resourceList
        ?.map((resource: ResourceType) => `\t- ${generateFileLink(resource)}`)
        .join('\n')
    : '';
  const finalTargetContent =
    targetFirstLine + targetOtherLine + targetResourceLine;

  return [date, timeStamp, finalTargetContent].map(String);
}

export function generateFileLink(resource: ResourceType): string {
  if (!resource.externalLink) {
    return `![[${generateFileName(resource)}]]`;
  }

  const prefix = resource.type?.includes('image') ? '!' : ''; // only add ! for image type

  return `${prefix}[${resource.name || resource.filename}](${
    resource.externalLink
  })`;
}

export function generateFileName(resource: ResourceType): string {
  return `${resource.id || resource.name?.split('/')[1]}-${resource.filename.replace(/[/\\?%*:|"<>]/g, '-')}`;
}

export function logMessage(message: string, level: LogLevel = LogLevel.info) {
  new Notice(message, 5000);

  if (level === LogLevel.info) {
    console.info(message);
  } else if (level === LogLevel.warn) {
    console.warn(message);
  } else if (level === LogLevel.error) {
    console.error(message);
    throw Error(message);
  }
}

export function generateHeaderRegExp(header: string) {
  const formattedHeader = /^#+/.test(header.trim())
    ? header.trim()
    : `# ${header.trim()}`;
  const reg = new RegExp(`(${formattedHeader}[^\n]*)([\\s\\S]*?)(?=\\n##|$)`);

  return reg;
}

export async function createPeriodicFile(
  day: Dayjs,
  periodType: string,
  settings: PluginSettings,
  app: App | undefined
): Promise<void> {
  if (!app || !settings.periodicNotesPath) {
    return;
  }

  const locale = window.localStorage.getItem('language') || 'en';
  const date = dayjs(day.format()).locale(locale);

  let templateFile = '';
  let folder = '';
  let file = '';

  const year = date.format('YYYY');
  let value;

  if (periodType === DAILY) {
    folder = `${settings.periodicNotesPath}/${year}/${periodType}/${String(
      date.month() + 1
    ).padStart(2, '0')}`;
    value = date.format('YYYY-MM-DD');
  } else if (periodType === WEEKLY) {
    folder = `${settings.periodicNotesPath}/${date.format(
      'gggg'
    )}/${periodType}`;
    value = date.format('gggg-[W]ww');
  } else if (periodType === MONTHLY) {
    folder = `${settings.periodicNotesPath}/${year}/${periodType}`;
    value = date.format('YYYY-MM');
  } else if (periodType === QUARTERLY) {
    folder = `${settings.periodicNotesPath}/${year}/${periodType}`;
    value = date.format('YYYY-[Q]Q');
  } else if (periodType === YEARLY) {
    folder = `${settings.periodicNotesPath}/${year}`;
    value = year;
  }

  file = `${folder}/${value}.md`;
  templateFile = settings.usePeriodicAdvanced
    ? settings[
        `periodicNotesTemplateFilePath${periodType}` as PeriodicNotesTemplateFilePath
      ] || `${settings.periodicNotesPath}/Templates/${periodType}.md`
    : `${settings.periodicNotesPath}/Templates/${periodType}.md`;
  await createFile(app, {
    locale,
    templateFile,
    folder,
    file,
  });
}

export function openOfficialSite(locale: string) {
  if (locale === 'zh-cn') {
    return (window.location.href = `${LIFE_OS_OFFICIAL_SITE}/zh`);
  }

  return (window.location.href = LIFE_OS_OFFICIAL_SITE);
}
