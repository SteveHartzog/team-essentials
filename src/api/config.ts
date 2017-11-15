import { Environment } from './index';
import { ConfigurationTarget, Uri, workspace, window, ViewColumn, TextEdit, WorkspaceEdit, Position, Range } from 'vscode';
import { join } from 'path';
import { isEmpty, forEach } from 'lodash';
import * as json from './json';
import * as env from './environment';
import * as UI from './ui'
import { isMultiRootWorkspace } from './environment';

/**
 * List of all the configuration files
 */
export enum ConfigurationFiles {
  /**
   * Extension recommendations and requirements are located here. (legacy: `.vscode/team.json`)
   */
  extensions = '.vscode/extensions.json',

  /**
   * Your teams' custom explorer filters are placed here. (legacy: `.vscode/team.json`)
   */
  filters = '.vscode/team-essentials/filters.json',

  /**
   * This is the current root's configuration and is where your explorer filter & team settings are applied.
   */
  folderSettings = '.vscode/settings.json',

  /**
   * This is the global PC settings for vscode that apply cross-project. It is normally located in the users' profile folder.
   */
  userGlobal = 'global',

  /**
   * User state is storied here (user's local filter, terminal choice, etc), (legacy: `.vscode/user.json`)
   */
  state = '.vscode/team-essentials/state.json',

  /**
   * This is for the configuration of Team Essentials extension (debug, statusbar, etc) for multi-root projects: `{project}.code-workspace`. (legacy: `.vscode/team.json`)
   */
  teamEssentials = 'teamEssentials',

  /**
   * The team settings will override the local folder settings in your environment. (legacy: `.vscode/team.json`)
   */
  teamSettings = '.vscode/team-essentials/settings.json',

  /**
   * This is for the configuraiton of Team Essentials extension (debug, statusbar, etc) for single-root projects. (legacy: `.vscode/team.json`)
   */
  teamEssentialsSingleRoot = '.vscode/team-essentials/config.json',
  /**
   * Legacy Team Essentials configuration.
   */
  legacyTeam = '.vscode/team.json',

  /**
 * Legacy Team Essentials configuration.
 */
  legacyState = '.vscode/user.json'
}
export default class Configuration {
  private static _globalSettings;
  private static _defaultStatusbarConfig = {
    disable: false,
    align: 'left',
    hideIcon: false,
    icon: 'search',
    priority: 0
  };
  private static _defaultDebugConfig = {
    start: {
      output: 'workbench.debug.action.focusRepl',
      explorer: 'workbench.view.debug'
    },
    stop: {
      output: 'workbench.action.output.toggleOutput',
      explorer: 'workbench.view.explorer',
      terminatePreLaunchTask: true
    }
  };
  private static _filters = {
    default: {},
    dev: {
      'node_modules': true,
      '.gitignore': true,
      '.stylelintrc': true,
      '.editorconfig': true,
      '.vscode': true,
      'package.json': true,
      'package-lock.json': true,
      'LICENSE': true,
      'README.md': true
    },
    admin: {}
  };

  // TODO: OldConfig to be deprecated by ~2.0
  /**
   * Save any object to any configuration location.
   *
   * @param workspacePath The full path of the a workspace folder.
   * @param config The particular configuration you want to modify
   * @param object The object that you want to write.
   * @param isOldConfig Is this an oldConfig?
   */
  static save(workspacePath, config: ConfigurationFiles, object: Object, isOldConfig: boolean = false) {
    UI.Output.log(`Saving: '${config}' to '${workspacePath}'`);

    let data = json.stringify(object);
    switch (config) {
      case ConfigurationFiles.filters:
        json.write(join(workspacePath, ConfigurationFiles.filters), data);
        break;

      case ConfigurationFiles.folderSettings:
        json.write(join(workspacePath, isOldConfig ? ConfigurationFiles.legacyTeam : ConfigurationFiles.folderSettings), data);
        break;

      case ConfigurationFiles.teamSettings:
        json.write(join(workspacePath, ConfigurationFiles.teamSettings), data);
        break;

      case ConfigurationFiles.state:
        if (isOldConfig) {
          let user = {};
          user['defaults.applied'] = object['settings'];
          user['extensions.required.installed'] = object['extensions'];
          user['explorer.filter'] = object['filter'];
          user['terminal'] = object['terminal'];
          json.write(join(workspacePath, ConfigurationFiles.legacyState), json.stringify(user));
        } else {
          json.write(join(workspacePath, ConfigurationFiles.state), data);
        }
        break;

      case ConfigurationFiles.teamEssentials:
        if (env.isMultiRootWorkspace()) {
          let teamEssentialsConfig = workspace.getConfiguration('teamEssentials');
          teamEssentialsConfig.update('debug', data['debug'], ConfigurationTarget.Workspace);
          teamEssentialsConfig.update('statusbar', data['statusbar'], ConfigurationTarget.Workspace);
        } else {
          // Single Root Workspace
          json.write(join(workspacePath, ConfigurationFiles.teamEssentialsSingleRoot), data);
        }
        break;

      case ConfigurationFiles.extensions:
        json.write(join(workspacePath, ConfigurationFiles.extensions), data);
        break;
    }
  }

  static setGlobal(section: string, value: any, toWorkspace = false) {
    UI.Output.log(`setGlobal('${section}') = '${value}')`);
    if (toWorkspace) { // for multi-root... use the workspace config
      workspace.getConfiguration().update(section, value, ConfigurationTarget.Workspace);
    } else { // otherwise to user global settings
      workspace.getConfiguration().update(section, value, ConfigurationTarget.Global);
    }
  }

  static getGlobal(section: string, fromWorkspace = false) {
    let value = workspace.getConfiguration(null, env.getResource()).inspect(section);
    if (fromWorkspace && value.workspaceValue) {
      UI.Output.log(`getGlobal('${section}'): ${value.workspaceValue}`);
      return value.workspaceValue;
    }
    UI.Output.log(`getGlobal('${section}'): ${value.globalValue}`);
    return value.globalValue;
  }

  static getLogLevel(fromWorkspace = false) {
    let level = this.getGlobal('teamEssentials.logLevel', env.isMultiRootWorkspace());
    if (!level) {
      return UI.LogLevel.info;
    } else {
      switch (level) {
        case UI.LogLevel.info:
          level = UI.LogLevel.info;
          break;
        case UI.LogLevel.errors:
          level = UI.LogLevel.errors;
          break;
        case UI.LogLevel.verbose:
          level = UI.LogLevel.verbose;
          break;
      }
    }
  }

  static load(workspacePath, isMultiRootWorkspace: boolean = true, isOldConfig: boolean = false) {
    if (isOldConfig) {
      let oldTeamConfig = json.getConfig(join(workspacePath, ConfigurationFiles.legacyTeam));
      let oldStateConfig = json.getConfig(join(workspacePath, ConfigurationFiles.legacyState));
      return {
        extensions: this._loadExtensions(workspacePath, oldTeamConfig),
        filters: oldTeamConfig['explorer.filters'],
        state: {
          extensions: oldStateConfig['extensions.required.installed'],
          filter: oldStateConfig['explorer.filter'],
          settings: oldStateConfig['defaults.applied']
        },
        teamSettings: oldTeamConfig['defaults'],
        folderSettings: json.getConfig(join(workspacePath, ConfigurationFiles.folderSettings)),
        teamEssentials: this.loadTeamEssentials(workspacePath, oldTeamConfig, isMultiRootWorkspace)
      }
    }
    return {
      extensions: this._loadExtensions(workspacePath),
      filters: json.getConfig(join(workspacePath, ConfigurationFiles.filters)),
      state: json.getConfig(join(workspacePath, ConfigurationFiles.state)),
      teamSettings: json.getConfig(join(workspacePath, ConfigurationFiles.teamSettings)),
      folderSettings: json.getConfig(join(workspacePath, ConfigurationFiles.folderSettings)),
      teamEssentials: this.loadTeamEssentials(workspacePath, null, isMultiRootWorkspace)
    };
  }

  private static _loadExtensions(workspacePath: string, oldConfig?: object) {
    let extensions = json.getConfig(join(workspacePath, ConfigurationFiles.extensions));
    if (extensions && oldConfig) {
      extensions['required'] = oldConfig['extensions.required'];
    }
    if (isEmpty(extensions)) {
      extensions = JSON.parse('{}');;
    }
    return extensions;
  }

  static loadTeamEssentials(workspacePath?: string, oldConfig?: object, isMultiRootWorkspace: boolean = true) {
    if (oldConfig && workspacePath) {
      let teamEssentialsConfig = this._parseOldDebugSettings(oldConfig);
      // Add new default settings for the statusbar
      teamEssentialsConfig['statusbar'] = this._defaultStatusbarConfig;
    } else {
      if (isMultiRootWorkspace) {
        // Start with the defaults (provided by `package.json`['contributes.configuration']), then override
        let teamEssentialsConfig = workspace.getConfiguration('teamEssentials');
        return {
          debug: teamEssentialsConfig.debug,
          statusbar: teamEssentialsConfig.statusbar
        };
      } else { // Single Root Workspace
        // Load config or default StatusbarConfig
        return workspacePath ? json.getConfig(join(workspacePath, ConfigurationFiles.teamEssentialsSingleRoot)) : this._defaultStatusbarConfig;
      }
    }
  }

  static async migrateConfigs(workspacePath: string, isMultiRootWorkspace: boolean = true) {
    let exists = env.createDirectory(join(workspacePath, '.vscode/team-essentials'))
    if (exists) {
      let oldConfig = json.getConfig(join(workspacePath, ConfigurationFiles.legacyTeam));
      let oldState = json.getConfig(join(workspacePath, ConfigurationFiles.legacyState));
      if (!oldConfig.hasOwnProperty('defaults')) {
        oldConfig['defaults'] = JSON.parse('{}');
      }
      if (!oldConfig.hasOwnProperty('explorer.filters')) {
        oldConfig['defaults'] = JSON.parse('{}');
      }

      // State migration
      this.save(workspacePath, ConfigurationFiles.state, {
        extensions: oldState['extensions.required.installed'],
        filter: oldState['explorer.filter'],
        settings: oldState['defaults.applied']
      });

      // Extensions migration
      this.save(workspacePath, ConfigurationFiles.extensions, this._loadExtensions(workspacePath, oldConfig));

      // Team Settings migration
      if (isMultiRootWorkspace) {
        let settings = oldConfig['defaults'];
        for (let setting in settings) {
          console.log(`adding setting: '${setting}': '${settings[setting]}'`)
          this.setGlobal(setting, settings[setting], true);
        }
      } else {
        this.save(workspacePath, ConfigurationFiles.teamSettings, oldConfig['defaults']);
      }

      // Filter migration
      this.save(workspacePath, ConfigurationFiles.filters, oldConfig['explorer.filters']);

      // Config migration (and statusbar defaults added gratis)
      this.save(workspacePath, ConfigurationFiles.teamEssentials, {
        debug: oldConfig.hasOwnProperty('debug') ? oldConfig['debug'] : this._defaultDebugConfig,
        statusbar: this._defaultStatusbarConfig
      });
    }
  }

  static createDefaultConfigs(workspacePath: string) {
    const out = UI.Output;
    out.info('Creating default configs.', 'running: ');

    // Create _state.json, then save to .vscode/team-essentials
    let state = {
      extensions: true,
      filter: 'admin'
    }
    this.save(workspacePath, ConfigurationFiles.state, state);

    // Create debug.json, then save to .vscode/team-essentials
    let debug = {
      start: {
        output: 'workbench.debug.action.focusRepl',
        explorer: 'workbench.view.debug'
      },
      stop: {
        output: 'workbench.action.output.toggleOutput',
        explorer: 'workbench.view.explorer',
        terminatePreLaunchTask: true
      }
    }
    this.save(workspacePath, ConfigurationFiles.teamEssentials, debug);

    // Create filters.json, then save to .vscode/team-essentials
    this.save(workspacePath, ConfigurationFiles.filters, this._filters);

    // Team Settings migration
    let folderSettings = json.getConfig(join(workspacePath, ConfigurationFiles.folderSettings));
    if (isMultiRootWorkspace) {
      forEach(folderSettings, (value, key) => { this.setGlobal(key, value, true); });
    } else {
      this.save(workspacePath, ConfigurationFiles.teamSettings, folderSettings);
    }
  }

  public static insertGitIgnoreSettings(workspacePath: string) {
    workspace.openTextDocument(join(workspacePath, '.gitignore')).then((gitignore) => {
      window.showTextDocument(gitignore, ViewColumn.One, true);
      let coords = { start: { line: gitignore.lineCount + 1, char: 0 }, end: { line: gitignore.lineCount + 5, char: 0 } };
      let edit = new WorkspaceEdit();
      let start = new Position(coords.start.line, coords.start.char);
      let end = new Position(coords.end.line, coords.end.char);
      let range = new Range(start, end);
      let change = new TextEdit(range, '\n\n## Team Essentials ##\n#####################\n.vscode/settings.json\n.vscode/team-essentials/state.json\n');
      edit.set(gitignore.uri, [change]);
      workspace.applyEdit(edit);
    });
  }

  private static _parseOldDebugSettings(oldSettings: object) {
    let teamEssentials = {};
    // Did an old debug setting exist?
    if (oldSettings.hasOwnProperty('debug')) {
      let debugStart = oldSettings['debug'].hasOwnProperty('start') ? oldSettings['debug']['start'] : {};
      let debugStop = oldSettings['debug'].hasOwnProperty('stop') ? oldSettings['debug']['stop'] : {};
      teamEssentials['debug'] = {
        'start.output': debugStart.hasOwnProperty('output') ? debugStart['output'] : '',
        'start.explorer': debugStart.hasOwnProperty('explorer') ? debugStart['explorer'] : '',
        'stop.output': debugStop.hasOwnProperty('output') ? debugStop['output'] : '',
        'stop.explorer': debugStop.hasOwnProperty('explorer') ? debugStop['explorer'] : '',
        'stop.terminatePreLaunchTask': debugStop.hasOwnProperty('terminatePreLaunchTask') ? debugStop['terminatePreLaunchTask'] : true
      };
    }
    return teamEssentials;
  }
}
