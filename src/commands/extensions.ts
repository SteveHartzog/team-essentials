import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import exe from '../util/execute';
import out from '../util/output';
import Config from '../data/config';

export default class Extensions {

  constructor(private outputChannel: vscode.OutputChannel, private config: Config) {
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
      this.installRequiredExtensions();
      this.config.userConfig['extensions.required.installed'] = true;
      this.config.saveUserConfig();
    }
  }

  public updateExtensions() {
    this.outputChannel.show();
    let updateType = vscode.window.showQuickPick(
      ['Required', 'Recommended', 'All'],
      { matchOnDescription: false, placeHolder: 'Update which extensions?' }
    ).then((updateType: string) => {
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
    });
  }

  private installRecommendedExtensions() {
    out.appendLine(this.outputChannel, 'running: Installing recommended team extensions.', true);
    if (this.config.extensionsConfig.hasOwnProperty('recommendations') && this.config.extensionsConfig['recommendations'].length > 0) {
      for (let extension of this.config.extensionsConfig['recommendations']) {
        if (vscode.extensions.getExtension(extension) === undefined) {
          out.appendLine(this.outputChannel, ` > Installing: ${extension}`);
          exe.runCommand('code', ['--install-extension', extension], this.outputChannel);
        }
      }
    }
    out.appendLine(this.outputChannel, ' > All recommended team extensions are installed.');
  }

  public installRequiredExtensions() {
    out.appendLine(this.outputChannel, 'running: Installing required team extensions.', true);
    if (this.config.teamConfig.hasOwnProperty('extensions.required') && this.config.teamConfig['extensions.required'].length > 0) {
      for (let extension of this.config.teamConfig['extensions.required']) {
        if (vscode.extensions.getExtension(extension) === undefined) {
          out.appendLine(this.outputChannel, ` > Installing: ${extension}`);
          exe.runCommand('code', ['--install-extension', extension], this.outputChannel);
        }
      }
    }
    out.appendLine(this.outputChannel, ' > All required team extensions are installed.');
  }
}