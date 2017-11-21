import { clone, isEmpty, remove } from 'lodash';
import { homedir, platform } from 'os';
import { join } from 'path';
import { commands, extensions, window, workspace, OutputChannel, QuickPickItem, Uri } from 'vscode';

// Utilities Namespace
import * as API from './api';

// API Dependencies
const statusbar = API.UI.Statusbar;
const env = API.Environment;
const exe = API.Execution;
const misc = API.Miscellaneous;
const out = API.UI.Output;
const config = API.Configuration;
const ConfigurationFiles = API.Enums.ConfigurationFiles;
const controls = API.UI.Controls;
const Choice = API.UI.Choice;
const MessageType = API.Enums.MessageType;

export class Folder {
  public name: string;
  public config;
  public path;
  public uri: Uri;
  private _filter: string;
  private _isOldConfig: boolean = true;

  constructor(workspaceFolder, private isMultiRootWorkspace: boolean) {
    out.log(`Initting folder: '${workspaceFolder.name}')`);
    this.uri = workspaceFolder.uri;
    this.path = this.uri.fsPath;
    this.name = workspaceFolder.name;

    if (env.hasConfig(this.name, this.path)) {
      this._isOldConfig = false;
      out.log(`Loading configuration for '${this.name}'`);
      this.config = config.load(this.path, isMultiRootWorkspace);
    } else if (env.hasOldConfig(this.name, this.path)) {
      out.info(`Loading **OLD** configuration for '${this.name}'`);
      this.config = config.load(this.path, isMultiRootWorkspace, true);
    }

    // Only continue init if a config was loaded;
    if (this.config) {
      // Apply/Reapply saved filter if it exists
      if (this.config.state.hasOwnProperty('filter')) {
        out.log(`Filter already applied for '${this.name}'`);
        this._filter = this.config.state.filter;
      }

      // Apply team settings ONLY if in single-root workspace
      if (!this.isMultiRootWorkspace) {
        this.applyTeamSettings();
      }

      // Workspace required extensions
      this.ensureRequiredExtensions();
    }
  }

  public needsMigration() {
    return this._isOldConfig;
  }

  public async reloadConfiguration() {
    this.config = await config.load(this.path, this.isMultiRootWorkspace);

    // Apply/Reapply saved filter if it exists
    if (this.config.state.hasOwnProperty('filter')) {
      out.log(`Filter already applied for '${this.name}'`);
      this._filter = this.config.state.filter;
      this.updateStatusBar();
    }
  }

  public updateStatusBar() {
    if (this.config && this.config.filters && Object.keys(this.config.filters).length > 0) {
      let prefix = '';
      if (this.isMultiRootWorkspace) {
        prefix = misc.titleCase(this.name) + ': ';
      }
      if (this._filter && this._filter.length > 0) {
        statusbar.setText(prefix + misc.titleCase(this._filter), this.config.teamEssentials);
      } else {
        statusbar.setText(prefix + '< Select a Filter >', this.config.teamEssentials);
      }
    } else {
      statusbar.hide();
    }
  }

  public applyTeamSettings(reApply: boolean = false) {
    const needSettingsSave = false;
    if (!isEmpty(this.config.teamSettings)) {
      // Have settings not been applied already, or are we overriding (manual call)?
      if (reApply ||
        (!this.config.state.hasOwnProperty('settings') ||
          this.config.state['settings'] === false)
      ) {
        // Check to see of team defaults exist, if so add them to our folderSettings
        if (!isEmpty(this.config.teamSettings)) {
          for (const setting in this.config.teamSettings) {
            this.config.folderSettings[setting] =
              this.config.teamSettings[setting];
          }
          out.info(`Applying Team Setttings for '${this.name}'`);

          // User folderSettings with the new applied teamSettings
          config.save(this.path, ConfigurationFiles.folderSettings, this.config.folderSettings);

          // Update state to reflect that teamSettings were applied
          this.config.state['settings'] = true;
          config.save(this.path, ConfigurationFiles.state, this.config.state);
        }
      } else {
        out.log(`Team Setttings already applied for '${this.name}'`);
      }
    }
  }

  //#region Extensions
  public async ensureRequiredExtensions() {
    const state = clone(this.config.state);
    if (!state.hasOwnProperty('extensions') || (state.hasOwnProperty('extensions') && state['extensions'] === false)) {
      out.log(`Required extensions not installed for workspace '${this.name}'.`);
      this.installRequiredExtensions();
      state['extensions'] = true;
      config.save(this.path, ConfigurationFiles.state, state);
    } else {
      out.log(`Required extensions have already been installed for workspace '${this.name}'.`);
    }
  }

  public async updateExtensions() {
    const options = [];
    if (!isEmpty(this.config.extensions)) {
      if (this.config.extensions.hasOwnProperty('recommendations')) {
        options.push(new Choice('Recommended', ''));
      }
      // if required extensions provided in `.vscode/extensions.json`
      if (this.config.extensions.hasOwnProperty('required')) {
        options.push(new Choice('Required', ''));
      }
    }
    if (options.length > 1) {
      options.push(new Choice('All', 'Install both recommended and required extensions.'));
    }
    if (options.length > 0) {
      const updateType = await controls.ShowChoices('Update which extensions?', options);
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
    } else {
      out.continue('No recommended or required extensions provided for this folder.');
    }
  }

  private installRecommendedExtensions() {
    const recommendedExtensions = clone(this.config.extensions)['recommendations'];
    out.info('Requesting recommended team extensions.', 'running: ');
    if (recommendedExtensions && recommendedExtensions.length > 0) {
      out.show();
      this.requestInstallations(recommendedExtensions);
      out.continue('All recommended team extensions are installing.');
    }
  }

  public installRequiredExtensions() {
    let requiredExtensions = clone(this.config.extensions)['required'];
    if (!requiredExtensions) {
      requiredExtensions = new Array();
    }
    out.info('Requesting required team extensions.', 'running: ');
    if (requiredExtensions && requiredExtensions.length > 0) {
      out.show();
      this.requestInstallations(requiredExtensions);
      out.continue('All required team extensions are installing.');
    }
  }

  private requestInstallations(requestedExtensions) {
    for (const extension of requestedExtensions) {
      if (extensions.getExtension(extension) === undefined) {
        out.continue(`Requesting: ${extension}`);
        exe.runCommand('code', this.path, ['--install-extension', extension]);
      }
    }
  }
  //#endregion

  //#region filter
  get filter() {
    return this._filter;
  }

  set filter(newFilter) {
    out.log(`Setting filter: '${newFilter}'`);
    if (this._filter !== newFilter) {
      this.changeFilter(newFilter);
      this.updateStatusBar();
    }
  }
  public async filterExplorer() {
    if (this.path) {
      // build the quickPick to get the newFilter
      let header = 'Select an explorer filter';
      header +=
        this.isMultiRootWorkspace
          ? ` for the ${this.name} workspace:`
          : ':';

      const chosenFilter = await controls.ShowChoices(header, this.getFilterNames());
      if (chosenFilter) {
        // Use chosen filter
        this.filter = chosenFilter;
      }
    }
  }

  public getFilterNames() {
    const filters = clone(this.config.filters);
    const choices = new Array();
    for (const choice in filters) {
      if (choice !== 'default') {
        choices.push(new Choice(misc.titleCase(choice), ''));
      }
    }
    return choices;
  }

  private changeFilter(choice) {
    const filters = clone(this.config.filters);
    const state = clone(this.config.state);
    const folderSettings = clone(this.config.folderSettings);

    // Clear any existing filter
    folderSettings['files.exclude'] = {};

    if (choice && filters) {
      for (const filter in filters) {
        // Apply chosen filter... but always apply default filter
        if (
          filter.toLowerCase() === choice.toLowerCase() ||
          filter.toLowerCase() === 'default'
        ) {
          for (const exclude in filters[filter.toLowerCase()]) {
            if (typeof filters[filter.toLowerCase()][exclude] === 'boolean') {
              folderSettings['files.exclude'][exclude] = true;
            } else {
              folderSettings['files.exclude'][exclude] = {
                when: '$(basename).ts'
              };
            }
          }
        }
      }
    }

    // Update workspace to reflect new filter
    config.save(this.path, ConfigurationFiles.folderSettings, folderSettings);

    // Update state only if needed
    if (choice !== state['filter']) {
      this._filter = this.config.state['filter'] = choice;
      config.save(this.path, ConfigurationFiles.state, state, this._isOldConfig);
    }
  }
  //#endregion
}