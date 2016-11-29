import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import Config from '../data/config';
import json from '../util/json';
import exe from '../util/execute';
import out from '../util/output';
import misc from '../util/misc';
import * as _ from 'lodash';

export default class FilterExplorer {
  constructor(private config: Config) {
    // Set Current User Filter if any
    if (this.config.userConfig.hasOwnProperty('explorer.filter') && this.config.userConfig['explorer.filter'].length > 0) {
      let explorerFilter = this.config.userConfig['explorer.filter'];
      out.updateStatusBar('Filtering code source...');
      this.applyFilter(explorerFilter);
      out.updateStatusBar(misc.titleCase(explorerFilter));
    } else {
      out.updateStatusBar('< Select Explorer Filter >');
    }

    fs.watchFile(path.join(vscode.workspace.rootPath, '.vscode/team.json'), { interval: 500 }, (event, filename) => {
      // Reload the new team config file
      this.config.loadConfig('team');
      // Reapply the filter
      if (this.config.teamConfig.hasOwnProperty('explorer.filters')) {
        this.applyFilter(this.config.userConfig['explorer.filter']);
      }
    });
  }

  public showQuickPick() {
    vscode.window.showQuickPick(
      this.getFilterNames(this.config.teamConfig['explorer.filters']),
      { matchOnDescription: false, placeHolder: 'Show what types of files?' }
    ).then((filter: string) => {
      filter = filter !== undefined ? filter.toLowerCase() : '';
      filter = filter === 'all' ? 'admin' : filter;
      if (filter.length > 0) {
        out.updateStatusBar('Filtering code source...');
        this.applyFilter(filter);
        out.updateStatusBar(misc.titleCase(filter))
        this.saveFilter(filter);
      }
    });
  }

  private getFilterNames(explorerFilters): string[] {
    let choices: string[] = [];
    for (let choice in explorerFilters) {
      choices.push(choice === 'all' ? 'Admin' : misc.titleCase(choice));
    }
    _.remove(choices, (item) => {
      return item === 'Default';
    });
    return choices;
  }

  private saveFilter(newFilter: string) {
    this.config.userConfig['explorer.filter'] = newFilter;
    this.config.saveUserConfig();
  }

  public applyFilter(filter: string): void {
    if (!this.config.workspaceSettings['files.exclude']) {
      this.config.workspaceSettings['files.exclude'] = {}
    }
    if (filter && filter.toLowerCase() === 'admin') {
      // Truncate files.exclude
      this.config.workspaceSettings['files.exclude'] = {};
      // for (let prop in this.config.workspaceSettings['files.exclude']) {
      //   this.config.workspaceSettings['files.exclude'][prop] = false;
      // }
      for (let exclude in this.config.teamConfig['explorer.filters']['admin']) {
        this.config.workspaceSettings['files.exclude'][exclude] = this.config.teamConfig['explorer.filters']['admin'][exclude];
      }
    } else {
      // Set Defaults
      for (let exclude in this.config.teamConfig['explorer.filters']['default']) {
        this.config.workspaceSettings['files.exclude'][exclude] = this.config.teamConfig['explorer.filters']['default'][exclude];
      }

      for (let explorerFilter in this.config.teamConfig['explorer.filters']) {
        if (explorerFilter !== 'admin' && explorerFilter !== 'default') {
          if (filter && explorerFilter === filter.toLowerCase()) {
            for (let exclude in this.config.teamConfig['explorer.filters'][explorerFilter.toLowerCase()]) {
              if (typeof this.config.teamConfig['explorer.filters'][explorerFilter.toLowerCase()][exclude] === 'boolean') {
                this.config.workspaceSettings['files.exclude'][exclude] = true;
              } else {
                this.config.workspaceSettings['files.exclude'][exclude] = {
                  "when": "$(basename).ts"
                };
              }
            }
          } else {
            for (let exclude in this.config.teamConfig['explorer.filters'][explorerFilter.toLowerCase()]) {
              this.config.workspaceSettings['files.exclude'][exclude] = false;
            }
          }
        }
      }
    }
    this.config.saveWorkspaceSettings();
  }
}