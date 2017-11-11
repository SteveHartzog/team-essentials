import { Uri, window, workspace } from 'vscode';
import * as vscode from 'vscode';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';
import { default as config } from './config';
import * as UI from './ui';

/**
 * List the platforms supported by electron.
 */
enum Platform {
  /**
   * Windows 10 (7 was good, 8 was meh, 10 is a great service)
   */
  windows = 'win32',

  /**
   * Mac OS (worse than Win10, seriously what happened Apple? - it's time for another revolution)
   */
  mac = 'darwin',

  /**
   * Linux (I seriously can't decide if this is a good thing... despite using different flavors over the years)
   */
  linux = 'linux'
}
export default class Environment {
  /**
   * Check if we are in a multi-root workspace.
   * @static
   * @memberOf Environment
   */
  static isMultiRootWorkspace() {
    let value = (workspace.workspaceFolders && workspace.workspaceFolders.length > 1)
    UI.Output.log(`isMultiRootWorkspace: ${value}`);
    return value;
  }

  static hasConfig(name: string, folderPath: string) {
    let value = this.confirmPath(this.getTeamPath(folderPath));
    UI.Output.log(`hasConfig('${name}'): ${value}`);
    return value;
  }

  static getRootFolderPath() {
    return vscode.workspace.workspaceFolders[vscode.workspace.workspaceFolders.length - 1].uri.fsPath;
  }

  static hasOldConfig(name: string, folderPath: string) {
    let value = this.confirmPath(this.getOldTeamFilePath(folderPath));
    UI.Output.log(`hasOldConfig('${name}'): ${value}`);
    return value;
  }

  static hasFilters(isMultiRootWorkspace: boolean) {
    UI.Output.log('Checking if env hasFilters...');
    if (isMultiRootWorkspace) {
      for (let folder in vscode.workspace.workspaceFolders) {
        if (this.hasFilter(vscode.workspace.workspaceFolders[folder].uri.fsPath)) {
          UI.Output.continue(`found filters @ '${vscode.workspace.workspaceFolders[folder].name}'`)
          return true;
        }
      }
      return false;
    } else {
      return (this.hasFilter(vscode.workspace.workspaceFolders[0].uri.fsPath));
    }
  }

  static hasFilter(folderPath: string) {
    return this.confirmPath(this.getTeamPath(folderPath));
  }

  static isNewUser() {
    let folders = workspace.workspaceFolders;
    for (let folder of folders) {
      if (folder.uri) {
        UI.Output.log('isNewUser(): false');
        return false;
      }
    }
    UI.Output.log('isNewUser(): true');
    return true;
  }

  static isWindows() {
    let value = platform() == Platform.windows;
    UI.Output.log(`Checking isWindows(): ${value}`);
    return value;
  }

  static getGlobalSettingsPath() {
    switch (platform()) {
      case Platform.windows:
        return join(homedir(), 'AppData/Roaming/Code/User/settings.json');

      case Platform.mac:
        return join(homedir(), 'Library/Application Support/Code/User/settings.json');

      case Platform.linux:
        return join(homedir(), '.config/Code/User/settings.json');
    }
  }

  static getWorkspaceFolderId(uri: Uri) {
    let workspaceFolder = workspace.getWorkspaceFolder(uri);
    UI.Output.log(`Getting Folder ID: '${uri.fsPath}' => ${workspaceFolder.index}`);
    return workspaceFolder.index;
  }

  // public static getFolderPath() {
  //   return vscode.
  //   let folder = workspace.workspaceFolders. //getWorkspaceFolder(uri);
  //   return folder.uri.fsPath;
  // }

  static getOldTeamFilePath(workspacePath): string {
    return join(workspacePath, '.vscode/team.json');
  }

  static getVsCodePath(workspacePath): string {
    return join(workspacePath, '.vscode');
  }

  static getTeamPath(workspacePath): string {
    return join(workspacePath, '.vscode/team-essentials');
  }

  static confirmPath(path: string): boolean {
    let value = existsSync(path);
    UI.Output.log(`confirmPath('${path}'): ${value}`);
    return value;
  }

  static createDirectory(dir: string): boolean {
    if (!this.confirmPath(dir)) {
      mkdirSync(dir);
      return true;
    }
    return true;
  }
}