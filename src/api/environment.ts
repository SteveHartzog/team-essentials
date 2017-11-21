import { existsSync, mkdirSync } from 'fs';
import { homedir, platform } from 'os';
import { join } from 'path';
import { window, workspace, Uri } from 'vscode';
import * as vscode from 'vscode';
import { Configuration as config, ConfigurationFiles } from './config';
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

export function isMultiRootWorkspace() {
  const value = (workspace.workspaceFolders && workspace.workspaceFolders.length > 1);
  UI.Output.log(`isMultiRootWorkspace: ${value}`);
  return value;
}

export function hasConfig(name: string, folderPath: string) {
  const value = this.confirmPath(this.getTeamPath(folderPath));
  UI.Output.log(`hasConfig('${name}'): ${value}`);
  return value;
}

export function hasOldConfig(name: string, folderPath: string) {
  const value = this.confirmPath(this.getOldTeamFilePath(join(folderPath)));
  UI.Output.log(`hasOldConfig('${name}'): ${value}`);
  return value;
}

export function hasFilters(isMultiRootWorkspace: boolean) {
  UI.Output.log('Checking if env hasFilters...');
  if (isMultiRootWorkspace) {
    for (const folder in vscode.workspace.workspaceFolders) {
      if (this.hasFilter(vscode.workspace.workspaceFolders[folder].uri.fsPath)) {
        UI.Output.continue(`found filters @ '${vscode.workspace.workspaceFolders[folder].name}'`);
        return true;
      }
    }
    return false;
  } else {
    return (this.hasFilter(vscode.workspace.workspaceFolders[0].uri.fsPath));
  }
}

export function hasFilter(folderPath: string) {
  return this.confirmPath(this.getTeamPath(folderPath));
}

export function isNewUser() {
  const folders = workspace.workspaceFolders;
  for (const folder of folders) {
    const legacyStatePath = join(folder.uri.fsPath, ConfigurationFiles.legacyState);
    const statePath = join(folder.uri.fsPath, ConfigurationFiles.state);
    if (this.confirmPath(legacyStatePath) || this.confirmPath(statePath)) {
      UI.Output.log('isNewUser(): false');
      return false;
    }
  }
  UI.Output.log('isNewUser(): true');
  return true;
}

export function getUserInfo() {
  const folders = workspace.workspaceFolders;
  let isNewUser = true;
  let isLegacyUser = false;
  let isCurrentUser = false;
  if (folders) {
    for (const folder of folders) {
      const legacyStatePath = join(folder.uri.fsPath, ConfigurationFiles.legacyState);
      const statePath = join(folder.uri.fsPath, ConfigurationFiles.state);
      if (this.confirmPath(statePath)) {
        isCurrentUser = true;
        break;
      }
      if (this.confirmPath(legacyStatePath)) {
        isLegacyUser = true;
        break;
      }
    }
  }
  if (isLegacyUser || isCurrentUser) {
    isNewUser = false;
  }
  UI.Output.log(`getUserInfo(): { isCurrentUser: ${isCurrentUser}, isLegacyUser: ${isLegacyUser}, isNewUser: ${isNewUser}`);
  return { isCurrentUser, isLegacyUser, isNewUser };
}

export function isWindows() {
  const value = platform() === Platform.windows;
  UI.Output.log(`Checking isWindows(): ${value}`);
  return value;
}

export function getRootFolderPath() {
  return vscode.workspace.workspaceFolders[vscode.workspace.workspaceFolders.length - 1].uri.fsPath;
}

export function getResource() {
  if (window.activeTextEditor) {
    return window.activeTextEditor.document.uri;
  } else {
    // use last workspace path if null
    const index = workspace.workspaceFolders.length > 0 ? workspace.workspaceFolders.length - 1 : 0;
    return workspace.workspaceFolders[index].uri;
  }
}

export function getWorkspaceFolderId(uri: Uri) {
  const workspaceFolder = workspace.getWorkspaceFolder(uri);
  UI.Output.log(`Getting Folder ID: '${uri.fsPath}' => ${workspaceFolder.index}`);
  return workspaceFolder.index;
}

export function getOldTeamFilePath(workspacePath): string {
  return join(workspacePath, '.vscode/team.json');
}

export function getVsCodePath(workspacePath): string {
  return join(workspacePath, '.vscode');
}

export function getTeamPath(workspacePath): string {
  return join(workspacePath, '.vscode/team-essentials');
}

export function confirmPath(path: string): boolean {
  const value = existsSync(path);
  UI.Output.log(`confirmPath('${path}'): ${value}`);
  return value;
}

export function createDirectory(dir: string): boolean {
  UI.Output.log(`Creating directory: '${dir}'`);
  if (!this.confirmPath(dir)) {
    mkdirSync(dir);
    return true;
  }
  return true;
}