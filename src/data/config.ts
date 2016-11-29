import * as vscode from 'vscode';
import * as path from 'path';
import json from '../util/json';

export default class Config {
  private teamConfigPath: string = path.join(vscode.workspace.rootPath, '.vscode/team.json');
  private userConfigPath: string = path.join(vscode.workspace.rootPath, '.vscode/user.json');
  private workspaceSettingsPath: string = path.join(vscode.workspace.rootPath, '.vscode/settings.json');
  private extensionsConfigPath: string = path.join(vscode.workspace.rootPath, '.vscode/extensions.json');
  private teamConfigJson: JSON;
  private userConfigJson: JSON;
  private workspaceSettingsJson: JSON;
  private extensionsConfigJson: JSON;

  constructor() {
    this.loadConfig('workspace');
    if (this.workspaceSettingsJson === undefined) {
      this.loadConfig('team');
      let defaults = (this.teamConfig)['defaults'];
      if (this.userConfig.hasOwnProperty('terminal')) {
        defaults.terminal = this.userConfig['terminal'];
        this.workspaceSettingsJson = json.getConfig(this.workspaceSettingsPath, defaults);
        this.saveWorkspaceSettings();
      }
    }
  }

  get userConfig() {
    if (this.userConfigJson === undefined) {
      this.userConfigJson = json.getConfig(this.userConfigPath);
    }
    return this.userConfigJson;
  }

  get teamConfig() {
    if (this.teamConfigJson === undefined) {
      this.teamConfigJson = json.getConfig(this.teamConfigPath);
    }
    return this.teamConfigJson;
  }

  get workspaceSettings() {
    if (this.workspaceSettingsJson === undefined) {
      this.workspaceSettingsJson = json.getConfig(this.workspaceSettingsPath);
    }
    return this.workspaceSettingsJson;
  }

  get extensionsConfig() {
    if (this.extensionsConfigJson === undefined) {
      this.extensionsConfigJson = json.getConfig(path.join(vscode.workspace.rootPath, '.vscode/extensions.json'));
    }
    return this.extensionsConfigJson;
  }

  public loadConfig(config: string) {
    switch (config) {
      case 'team':
        this.teamConfigJson = json.getConfig(this.teamConfigPath);
        break;

      case 'user':
        this.userConfigJson = json.getConfig(this.userConfigPath);
        break;

      case 'workspace':
        this.workspaceSettingsJson = json.getConfig(this.workspaceSettingsPath);
        break;
    }
  }

  public saveUserConfig() {
    json.writeFile(this.userConfigPath, json.stringify(this.userConfigJson));
  }

  public saveWorkspaceSettings() {
    json.writeFile(this.workspaceSettingsPath, json.stringify(this.workspaceSettingsJson));
  }
}