import { OutputChannel, MessageItem as _MessageItem, QuickPickItem, StatusBarAlignment, StatusBarItem, ViewColumn, window } from 'vscode';
import { clone } from 'lodash';
import * as misc from './misc';
import { default as config } from './config';

export enum MessageType { Error, Info, Warning }
export class Controls {
  public static async ShowChoices(question: string, choices: Choice[], callback: Function) {
    let choice = await window.showQuickPick(choices, { placeHolder: question, matchOnDescription: false, ignoreFocusOut: true });
    await callback(choice);
  }

  public static ShowMessage(messageType: MessageType, message: string, items = []) {
    switch (messageType) {
      case MessageType.Info:
        return items
          ? window.showInformationMessage(message, ...items)
          : window.showInformationMessage(message);
      case MessageType.Warning:
        return items
          ? window.showWarningMessage(message, ...items)
          : window.showWarningMessage(message);
      case MessageType.Error:
        return items
          ? window.showErrorMessage(message, ...items)
          : window.showErrorMessage(message);
    }
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
    let teamEssentials = config.loadTeamEssentials();
    this.statusBarItem = window.createStatusBarItem(
      teamEssentials['statusbar.align'] == "left"
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
    let texts = this.statusBarItem.text.split(")");
    let text = texts[texts.length - 1].trim();
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
      let icon = settings['statusbar.icon']
        ? settings['statusbar.icon']
        : "search";
      this.statusBarItem.text = '$(' + icon + ')  ' + text;
    }
    if (settings['statusbar.disable'] != false) {
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
  private static _logLevel: LogLevel = LogLevel.info;

  public static setChannel(outputChannel) {
    this._outputChannel = outputChannel;
  }

  public static setLogLevel(logLevel: string) {
    switch (logLevel) {
      case LogLevel.info:
        this._logLevel = LogLevel.info;
        break;
      case LogLevel.errors:
        this._logLevel = LogLevel.errors;
        break;
      case LogLevel.verbose:
        this._logLevel = LogLevel.verbose;
        break;
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

  public static log(content: string) {
    if (this._logLevel !== LogLevel.info && this._logLevel !== LogLevel.errors) {
      this.append(content, 'LOG: ', false, false);
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
    let line = '________________________________________________________________________________';
    this.append(line, '', true, false);
  }
}