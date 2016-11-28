import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import json from '../util/json';
import * as events from 'events';

export default class Config {
  private teamConfigPath: string = path.join(vscode.workspace.rootPath, '.vscode/team.json');
  private userConfigPath: string = path.join(vscode.workspace.rootPath, '.vscode/user.json');
  private workspaceSettingsPath: string = path.join(vscode.workspace.rootPath, '.vscode/settings.json');
  private extensionsConfigPath: string = path.join(vscode.workspace.rootPath, '.vscode/extensions.json');
  private teamConfigJson: JSON;
  private userConfigJson: JSON;
  private workspaceSettingsJson: JSON;
  private userSettingsJson: JSON;
  private extensionsConfigJson: JSON;
  private teamConfigChanged: boolean = true;
  private userConfigChanged: boolean = true;
  private extensionsConfigChanged: boolean = true;
  private userSettingsChanged: boolean = true;
  private workspaceSettingsChanged: boolean = true;

  constructor() {
    // start watching our config files for changes
    fs.watch(path.join(vscode.workspace.rootPath, '.vscode'), function (event, filename) {
      if (event === 'change') {
        switch (filename) {
          case this.userConfigPath:
            this.userConfigChanged = true;
            this.userConfig();
            process.emit('userConfig.changed');
            break;
          case this.teamConfigPath:
            this.teamConfigChanged = true;
            this.teamConfig();
            process.emit('teamConfig.changed');
            break;
        }
      }
    });
  }

  get userConfig() {
    if (this.userConfigChanged) {
      let defaultJson: JSON = JSON.parse('{}');
      this.userConfigJson = json.getConfig(this.userConfigPath, defaultJson);
      this.userConfigChanged = false;
    }
    return this.userConfigJson;
  }

  get teamConfig() {
    if (this.teamConfigChanged) {
      this.teamConfigJson = json.getConfig(this.teamConfigPath);
      this.teamConfigChanged = false;
    }
    return this.teamConfigJson;
  }

  get workspaceSettings() {
    if (this.workspaceSettingsChanged) {
      let defaults = this.teamConfig['defaults'];
      if (this.userConfig.hasOwnProperty('terminal')) {
        defaults.terminal = this.userConfig['terminal'];
      }
      this.workspaceSettingsJson = json.getConfig(this.workspaceSettingsPath, defaults);
      this.workspaceSettingsChanged = false;
    }
    return this.workspaceSettingsJson;
  }

  get extensionsConfig() {
    if (this.extensionsConfigChanged) {
      this.extensionsConfigJson = json.getConfig(path.join(vscode.workspace.rootPath, '.vscode/extensions.json'));
      this.extensionsConfigChanged = false;
    }
    return this.extensionsConfigJson;
  }

  public saveUserConfig() {
    json.writeFile(this.userConfigPath, json.stringify(this.userConfigJson));
  }

  public saveWorkspaceSettings() {
    json.writeFile(this.workspaceSettingsPath, json.stringify(this.workspaceSettingsJson));
  }
}