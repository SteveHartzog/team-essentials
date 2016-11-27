import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as _ from 'lodash';
import exe from './util/execute';
import json from './util/json';
import out from './util/output';
import misc from './util/misc';

export default class Commands {
  private static filter: string;
  private static teamConfigPath: string;
  private static userConfigPath: string;
  private static userSettingsPath: string;
  private static teamConfig: JSON;
  private static userConfig: JSON;
  private static userSettings: JSON;
  private static extensionsConfig: JSON;
  private static outputChannel: vscode.OutputChannel;

  public static registerCommands(outputChannel: vscode.OutputChannel): vscode.Disposable {

    // Initialize values
    this.outputChannel = outputChannel;
    this.teamConfigPath = path.join(vscode.workspace.rootPath, '.vscode/team.json');
    this.teamConfig = json.getConfig(this.teamConfigPath);
    this.userConfigPath = path.join(vscode.workspace.rootPath, '.vscode/user.json');
    this.userConfig = json.getConfig(this.userConfigPath);
    this.extensionsConfig = json.getConfig(path.join(vscode.workspace.rootPath, '.vscode/extensions.json'));
    switch (os.platform()) {
      case 'win32':
        this.userSettingsPath = process.env.APPDATA + '/Code/User/settings.json';
        break;
      case 'mac':
        this.userSettingsPath = '$HOME/Library/Application Support/Code/User/settings.json'
        break;
      default:
        this.userSettingsPath = '$HOME/.config/Code/User/settings.json';
        break;
    }
    this.userSettings = json.getConfig(this.userSettingsPath);
    this.setup();

    return vscode.Disposable.from(
      vscode.commands.registerCommand('extension.changeWindowsShell', () => this.changeWindowsShell()),
      vscode.commands.registerCommand('extension.filterExplorer', () => this.filterExplorer()),
      vscode.commands.registerCommand('extension.updateExtensions', () => this.updateExtensions()),
      // vscode.commands.registerCommand('extension.runCommand', () => this.runCommand()),
      // vscode.commands.registerCommand('extension.runTask', () => this.runTask())
    );
  }

  private static setup() {
    out.createStatusBar();

    // Set Current User Filter if any
    if (this.userConfig.hasOwnProperty('explorerFilter') && this.userConfig['explorerFilter'].length > 0) {
      this.filter = this.userConfig['explorerFilter'];
      out.updateStatusBar(misc.titleCase(this.filter));
    } else {
      out.updateStatusBar('< Select Explorer Filter >');
      this.userConfig['explorerFilter'] = '';
      json.writeFile(this.userConfigPath, json.stringify(this.userConfig));
    }

    // Ensure required extensions have been installed.
    let needRequired = false;
    if (!this.userConfig.hasOwnProperty('requiredExtensionsInstalled')) {
      needRequired = true;
    } else {
      if (this.userConfig['requiredExtensionsInstalled'] === false) {
        needRequired = true;
      }
    }
    if (needRequired) {
      this.installRequiredExtensions();
      this.userConfig['requiredExtensionsInstalled'] = true;
      json.writeFile(this.userConfigPath, json.stringify(this.userConfig));
    }
  }

  private static async changeWindowsShell() {
    if (os.platform() === 'win32') {
      let choice = await vscode.window.showQuickPick(
        ['Command Prompt', 'PowerShell', 'Bash on Ubuntu'],
        { matchOnDescription: false, placeHolder: 'Which shell?' }
      );
      let cli;
      if (choice && choice.length > 0) {
        switch (choice) {
          case 'Command Prompt':
            cli = "C:\\Windows\\sysnative\\cmd.exe";
            break;
          case 'PowerShell':
            cli = 'C:\\Windows\\sysnative\\WindowsPowerShell\\v1.0\\powershell.exe';
            break;
          case 'Bash on Ubuntu':
            cli = 'C:\\Windows\\sysnative\\bash.exe';
            break;
        }
        if (cli.length > 0) {
          // Save to user settings
          if (this.userSettings.hasOwnProperty('terminal.integrated.shell.windows') && this.userSettings['terminal.integrated.shell.windows'] !== cli) {
            this.userSettings['terminal.integrated.shell.windows'] = cli;
            json.writeFile(this.userSettingsPath, json.stringify(this.userSettings));
          }
          // Notify user to restart VS Code
          vscode.window.showInformationMessage('Restart Code to see your chosen integrated terminal.');
        }
      }
    }
  }


  private static async updateExtensions() {
    this.outputChannel.show();
    let updateType = await vscode.window.showQuickPick(
      ['Required', 'Recommended', 'All'],
      { matchOnDescription: false, placeHolder: 'Update which extensions?' }
    );
    if (updateType !== undefined && updateType.length > 0) {
      switch (updateType) {
        case 'Required':
          this.installRequiredExtensions();
          break;
        case 'Recommended':
          this.installRecommendedExtensions();
          break;
        case 'All':
          this.installRequiredExtensions();
          this.installRecommendedExtensions();
      }
    }
  }

  private static installRecommendedExtensions() {
    out.appendLine(this.outputChannel, 'running: Installing recommended team extensions.', true);
    if (this.extensionsConfig.hasOwnProperty('recommendations') && this.extensionsConfig['recommendations'].length > 0) {
      for (let extension of this.extensionsConfig['recommendations']) {
        if (vscode.extensions.getExtension(extension) === undefined) {
          out.appendLine(this.outputChannel, ` > Installing: ${extension}`);
          exe.runCommand('code', ['--install-extension', extension], this.outputChannel);
        }
      }
    }
    out.appendLine(this.outputChannel, ' > All recommended team extensions are installed.');
  }

  private static installRequiredExtensions() {
    out.appendLine(this.outputChannel, 'running: Installing required team extensions.', true);
    if (this.teamConfig.hasOwnProperty('requiredExtensions') && this.teamConfig['requiredExtensions'].length > 0) {
      for (let extension of this.teamConfig['requiredExtensions']) {
        if (vscode.extensions.getExtension(extension) === undefined) {
          out.appendLine(this.outputChannel, ` > Installing: ${extension}`);
          exe.runCommand('code', ['--install-extension', extension], this.outputChannel);
        }
      }
    }
    out.appendLine(this.outputChannel, ' > All required team extensions are installed.');
  }


  /**
   * Gets valid filter names from the explorer filters.
   *
   * @private
   * @static
   * @returns {string[]}
   *
   * @memberOf Commands
   */
  private static getFilterNames(): string[] {
    let choices: string[] = [];
    for (let choice in this.teamConfig['explorerFilters']) {
      choices.push(choice === 'all' ? 'Admin' : misc.titleCase(choice));
    }
    _.remove(choices, (item) => {
      return item === 'Default';
    });
    return choices;
  }

  /**
   * extension.filterExplorer: This extension will show the selected filter.
   *
   * @private
   * @static
   * @param {vscode.OutputChannel} outputChannel
   * @returns {Promise<void>}
   *
   * @memberOf Commands
   */
  private static async filterExplorer(): Promise<void> {
    this.filter = await vscode.window.showQuickPick(
      this.getFilterNames(),
      { matchOnDescription: false, placeHolder: 'Show what types of files?' }
    );
    let saveChoice = this.filter ? this.filter.toLowerCase() : '';
    saveChoice = saveChoice === 'all' ? 'admin' : saveChoice;
    if (saveChoice.length > 0) {
      if (this.filter) {
        out.updateStatusBar('Filtering code source...');
        await this.updateVisibility(this.filter);
        out.updateStatusBar(misc.titleCase(this.filter))
      }
      json.writeFile(this.userConfigPath, json.stringify({ explorerFilter: saveChoice }));
    }
  }

  /**
   * Updates the visibility of the current user settings file.
   * @private
   * @static
   * @param {string} filterGroup
   *
   * @memberOf Commands
   */
  private static updateVisibility(filterGroup: string): void {
    if (!this.userSettings['files.exclude']) {
      this.userSettings['files.exclude'] = {}
    }
    if (filterGroup.toLowerCase() === 'admin') {
      for (let prop in this.userSettings['files.exclude']) {
        this.userSettings['files.exclude'][prop] = false;
      }
      for (let exclude in this.teamConfig['explorerFilters']['admin']) {
        if (typeof this.teamConfig['explorerFilters']['default'][exclude] === 'boolean') {
          this.userSettings['files.exclude'][exclude] = true;
        } else {
          this.userSettings['files.exclude'][exclude] = {
            "when": "$(basename).ts"
          };
        }
      }
    } else {
      // Set Defaults
      for (let exclude in this.teamConfig['explorerFilters']['default']) {
        if (typeof this.teamConfig['explorerFilters']['default'][exclude] === 'boolean') {
          this.userSettings['files.exclude'][exclude] = true;
        } else {
          this.userSettings['files.exclude'][exclude] = {
            "when": "$(basename).ts"
          };
        }
      }

      for (let explorerFilter in this.teamConfig['explorerFilters']) {
        if (explorerFilter !== 'admin' && explorerFilter !== 'default') {
          if (explorerFilter === filterGroup.toLowerCase()) {
            for (let exclude in this.teamConfig['explorerFilters'][explorerFilter.toLowerCase()]) {
              if (typeof this.teamConfig['explorerFilters'][explorerFilter.toLowerCase()][exclude] === 'boolean') {
                this.userSettings['files.exclude'][exclude] = true;
              } else {
                this.userSettings['files.exclude'][exclude] = {
                  "when": "$(basename).ts"
                };
              }
            }
          } else {
            for (let exclude in this.teamConfig['explorerFilters'][explorerFilter.toLowerCase()]) {
              this.userSettings['files.exclude'][exclude] = false;
            }
          }
        }
      }
    }
    json.writeFile(this.userSettingsPath, json.stringify(this.userSettings));
  }
}