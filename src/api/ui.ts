import { clone } from 'lodash';
import { window, workspace, MessageItem as _MessageItem, OutputChannel, QuickPickItem, StatusBarAlignment, StatusBarItem, ViewColumn } from 'vscode';
import { Configuration as config } from './config';
import * as env from './environment';
import * as misc from './misc';

export enum MessageType { Error, Info, Warning }
export class Controls {
  public static async ShowChoices(question: string, choices: Choice[]): Promise<string> {
    let result = '';
    await window.showQuickPick(choices, { placeHolder: question, matchOnDescription: false, ignoreFocusOut: true }).then((choice) => {
      if (choice) {
        result = choice.label;
      }
    });
    return result;
  }

  public static async ShowMessage(messageType: MessageType, message: string, items = []): Promise<string> {
    let result = '';
    switch (messageType) {
      case MessageType.Info:
        return items
          ? await window.showInformationMessage(message, ...items).then((choice) => result = choice)
          : await window.showInformationMessage(message);
      case MessageType.Warning:
        return items
          ? window.showWarningMessage(message, ...items).then((choice) => result = choice)
          : window.showWarningMessage(message);
      case MessageType.Error:
        return items
          ? window.showErrorMessage(message, ...items).then((choice) => result = choice)
          : window.showErrorMessage(message);
    }
    return result;
  }
}

export class Choice implements QuickPickItem {
  public label: string;
  public description: string;
  public detail: string;
  constructor(answer: string, description: string, detail?: string) {
    this.label = answer;
    this.description = description;
    this.detail = detail;
  }
}

export class Statusbar {
  private static statusBarItem: StatusBarItem;

  public static create() {
    const teamEssentials = config.loadTeamEssentials();
    this.statusBarItem = window.createStatusBarItem(
      teamEssentials['statusbar.align'] === 'left'
        ? StatusBarAlignment.Left
        : StatusBarAlignment.Right,
      teamEssentials['statusbar.priority'] > -1
        ? teamEssentials['statusbar.priority']
        : null
    );
    this.statusBarItem.command = 'teamEssentials.filterExplorer';
    this.statusBarItem.tooltip = 'Click to change the explorer filter';
  }

  public static updateConfig() {
    const texts = this.statusBarItem.text.split(')');
    const text = texts[texts.length - 1].trim();
    // Destroy current
    this.statusBarItem.dispose();
    this.create();
    this.setText(text);
  }

  public static hide() {
    this.statusBarItem.hide();
  }

  public static setText(text: string, settings = config.loadTeamEssentials()) {
    if (settings['statusbar.hideIcon']) {
      this.statusBarItem.text = text;
    } else {
      const icon = settings['statusbar.icon']
        ? settings['statusbar.icon']
        : 'search';
      this.statusBarItem.text = `$(${icon})  ${text}`;
    }
    if (settings['statusbar.disable'] !== false) {
      this.statusBarItem.show();
    }
  }
}

/**
 * Logging levels
 */
export enum LogLevel {
  /**
   * Show All
   */
  verbose = 'verbose',

  /**
   * Show info & errors
   */
  info = 'info',

  /**
   * Show only errors
   */
  errors = 'errors'
}
export class Output {
  private static _outputChannel: OutputChannel;
  private static _logLevel: LogLevel;

  public static isInitialized() {
    return (this._outputChannel);
  }

  static startChannel() {
    this._outputChannel = window.createOutputChannel('Team Essentials');
    this.setLogLevel();
  }

  public static setLogLevel(logLevel?: string) {
    const level = logLevel ? logLevel : config.getGlobal('teamEssentials.logLevel', (workspace.workspaceFolders && workspace.workspaceFolders.length > 1));
    switch (level) {
      case LogLevel.errors:
        this._logLevel = LogLevel.errors;
        break;
      case LogLevel.verbose:
        this._logLevel = LogLevel.verbose;
        break;
      default:
        this._logLevel = LogLevel.info;
    }
  }

  public static show() {
    this._outputChannel.show();
  }

  public static error(content: string) {
    this.appendLine();
    this.append(content + '\n', 'ERROR: ', false, false);
  }

  public static info(content: string, label: string = 'INFO: ') {
    if (this._logLevel === LogLevel.info || this._logLevel === LogLevel.verbose) {
      this.append(content, label, false, false);
    }
  }

  public static continue(content: string) {
    if (this._logLevel === LogLevel.info || this._logLevel === LogLevel.verbose) {
      this.append(content, '              > ', true, false);
    }
  }

  public static log(content: string, label: string = 'LOG: ') {
    if (this._logLevel && this._logLevel !== LogLevel.info && this._logLevel !== LogLevel.errors) {
      this.append(content, label, false, false);
    }
  }

  private static append(content: string, label: string, disableTimeString, addNewlineBefore: boolean) {
    let msg = addNewlineBefore ? '\n' : '';
    msg += disableTimeString ? '' : `[${(new Date()).toLocaleTimeString()}] `;
    msg += `${label}`;
    msg += content;
    this._outputChannel.appendLine(`${msg}`);
  }

  private static appendLine() {
    const line = '________________________________________________________________________________';
    this.append(line, '', true, false);
  }
}