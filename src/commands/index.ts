import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as _ from 'lodash';
import * as fs from 'fs';
// import * as watchFixed from 'node-watch';
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
    this.setup();
    this.startFileWatchers();

    return vscode.Disposable.from(
      vscode.commands.registerCommand('teamEssentials.changeWindowsShell', () => this.changeWindowsShell.applyShell()),
      vscode.commands.registerCommand('teamEssentials.filterExplorer', () => this.filterExplorer.showQuickPick()),
      vscode.commands.registerCommand('teamEssentials.updateExtensions', () => this.extensions.updateExtensions()),
    );
  }

  private setup() {
    this.config = new Config();
    this.filterExplorer = new FilterExplorer(this.config);
    this.extensions = new Extensions(this.outputChannel, this.config);
    this.changeWindowsShell = new ChangeWindowsShell(this.config);

    out.createStatusBar();
    // Set Current User Filter if any
    if (this.config.userConfig.hasOwnProperty('explorer.filter') && this.config.userConfig['explorer.filter'].length > 0) {
      let explorerFilter = this.config.userConfig['explorer.filter'];
      out.updateStatusBar('Filtering code source...');
      this.filterExplorer.applyFilter(explorerFilter);
      out.updateStatusBar(misc.titleCase(explorerFilter));
    } else {
      out.updateStatusBar('< Select Explorer Filter >');
    }

    // Ensure required extensions have been installed.
    let needRequired = false;
    if (!this.config.userConfig.hasOwnProperty('extensions.required.installed')) {
      needRequired = true;
    } else {
      if (this.config.userConfig['extensions.required.installed'] === false) {
        needRequired = true;
      }
    }
    if (needRequired) {
      this.extensions.installRequiredExtensions();
      this.config.userConfig['extensions.required.installed'] = true;
      this.config.saveUserConfig();
    }
  }

  private startFileWatchers() {
    fs.watchFile(path.join(vscode.workspace.rootPath, '.vscode/team.json'), { interval: 500 }, (event, filename) => {
      // Reload the new team config file
      this.config.loadConfig('team');
      // Reapply the filter
      this.filterExplorer.applyFilter(this.config.userConfig['explorer.filter']);
    });
  }
}