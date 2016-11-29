import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
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
    let vsCodeDirectoryPath = path.join(vscode.workspace.rootPath, '.vscode'); 
    if (!fs.existsSync(vsCodeDirectoryPath)) {
      fs.mkdirSync(vsCodeDirectoryPath);
    }
  }

  get userConfig() {
    if (typeof this.userConfigJson === 'undefined') {
      this.loadConfig('user');
    }
    return this.userConfigJson;
  }

  get teamConfig() {
    if (typeof this.userConfigJson === 'undefined') {
      this.loadConfig('team');
    }
    return this.teamConfigJson;
  }

  get workspaceSettings() {
    if (typeof this.workspaceSettingsJson === 'undefined') {
      this.loadConfig('workspace');
    }
    return this.workspaceSettingsJson;
  }

  get extensionsConfig() {
    if (typeof this.extensionsConfigJson === 'undefined') {
      this.loadConfig('extensions');
    }
    return this.extensionsConfigJson;
  }

  public isEmpty(config: string) {
    let obj;
    switch (config) {
      case 'team':
        obj = this.teamConfig;
        break;
      case 'workspace':
        obj = this.workspaceSettings;
        break;
      case 'user':
        obj = this.userConfig;
        break;
      case 'extensions':
        obj = this.extensionsConfig;
        break;
      default:
        return true;
    }
    for(var prop in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, prop)) {
        return false;
      }
    }
    return true;
  }

  public loadConfig(config: string, defaults?: JSON) {
    switch (config) {
      case 'team':
        this.teamConfigJson = json.getConfig(this.teamConfigPath);
        if (this.teamConfigJson === undefined) {      
          if (defaults) {
            this.teamConfigJson = defaults;
          } else {
            this.teamConfigJson = JSON.parse('{}');
          }
        }
        break;

      case 'user':
        this.userConfigJson = json.getConfig(this.userConfigPath);
        if (this.userConfigJson === undefined) {
          if (defaults) {
            this.userConfigJson = defaults;
            this.saveUserConfig();
          } else {
            this.userConfigJson = JSON.parse('{}');
          }
        }
        break;

      case 'workspace':
        this.workspaceSettingsJson = json.getConfig(this.workspaceSettingsPath);
        if (this.workspaceSettingsJson === undefined) {
          if (defaults) {
            this.workspaceSettingsJson = defaults;
            this.saveWorkspaceSettings();
          } else {
            this.workspaceSettingsJson = JSON.parse('{}');
          }
        }
      case 'extensions':
        this.extensionsConfigJson = json.getConfig(this.extensionsConfigPath);
        if (this.extensionsConfigJson === undefined) {
          if (defaults) {
            this.extensionsConfigJson = defaults;
          } else {
            this.extensionsConfigJson = JSON.parse('{}');
          }
        }
        break;
    }
  }

  public saveUserConfig() {
    json.writeFile(this.userConfigPath, json.stringify(this.userConfigJson));
  }

  public saveWorkspaceSettings(overrideJson?: JSON) {
    if (overrideJson) {
      json.writeFile(this.workspaceSettingsPath, json.stringify(overrideJson));
      this.workspaceSettingsJson = overrideJson;  
    } else {
      json.writeFile(this.workspaceSettingsPath, json.stringify(this.workspaceSettingsJson));
    }
  }
}