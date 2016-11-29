import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as _ from 'lodash';
import Extensions from './extensions';
import FilterExplorer from './filterExplorer';
import ChangeWindowsShell from './changeWindowsShell';
import exe from '../util/execute';
import json from '../util/json';
import out from '../util/output';
import misc from '../util/misc';
import Config from '../data/config';

export default class Commands {
  private changeWindowsShell: ChangeWindowsShell;
  private filterExplorer: FilterExplorer;
  private extensions: Extensions;
  private config: Config;
  private fsTimeout: NodeJS.Timer = null;

  constructor(private outputChannel: vscode.OutputChannel) { }

  public register(): vscode.Disposable {
    out.createStatusBar();
    this.config = new Config();
    this.confirmWorkspaceSettings();
    this.initializeCommands();

    return vscode.Disposable.from(
      vscode.commands.registerCommand('teamEssentials.changeWindowsShell', () => this.changeWindowsShell.applyShell()),
      vscode.commands.registerCommand('teamEssentials.filterExplorer', () => this.filterExplorer.showQuickPick()),
      vscode.commands.registerCommand('teamEssentials.updateExtensions', () => this.extensions.updateExtensions()),
    );
  }

  private confirmWorkspaceSettings() {
    let defaultWorkspace: JSON = JSON.parse('{}');
    if (!this.config.isEmpty('team')) {
      if (this.config.teamConfig.hasOwnProperty('defaults')) {
        defaultWorkspace['defaults'] = this.config.teamConfig['defaults'];
      }
      if (!this.config.isEmpty('user') && this.config.userConfig.hasOwnProperty('terminal')) {
        defaultWorkspace['terminal'] = this.config.userConfig['terminal'];
      }
      if (!this.config.userConfig.hasOwnProperty('defaults.applied') || this.config.userConfig['defaults.applied'] === false) {
        this.config.saveWorkspaceSettings(defaultWorkspace);
        this.config.userConfig['defaults.applied'] = true;
        this.config.saveUserConfig();
      }
    }
  }

  private initializeCommands() {
    this.filterExplorer = new FilterExplorer(this.config);
    this.extensions = new Extensions(this.outputChannel, this.config);
    this.changeWindowsShell = new ChangeWindowsShell(this.config);  
  }

}