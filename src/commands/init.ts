import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import exe from '../util/execute';
import out from '../util/output';

export default class Init {
  private static outputChannel: vscode.OutputChannel;


  /**
   * extension.newtInit: This will run the initializer for a Newton project.
   *
   * @private
   * @static
   * @param {any} outputChannel
   * @returns {Promise<void>}
   *
   * @memberOf Init
   */
  private static async Init(): Promise<void> {
    // switch to output
    await this.installDependencies();
    await this.setupMaterializeCss();
    // await this.installRecommendedExtensions();
    // await this.installRequiredExtensions();

    // Reload Windows to enable any new extensions, if any, and user approves
    // if (this.installTeamExtensions()) {
    //   let response = await vscode.window.showQuickPick(
    //     ['No', 'Yes'],
    //     { matchOnDescription: false, placeHolder: 'Reload now to enable extensions?' }
    //   );
    //   if (response !== undefined && response === 'Yes') {
    //     vscode.commands.executeCommand("workbench.action.reloadWindow");
    //   }
    // }

  }

  private static installDependencies() {
    out.appendLine(this.outputChannel, 'running: Install npm dependencies');
    exe.runCommand('npm', ['install', '--no-progress', '--loglevel', 'error'], this.outputChannel);
    exe.runCommand('npm', ['install', '-g', 'aurelia-cli@0.22.0', '--no-progress', '--loglevel', 'error'], this.outputChannel);
    exe.runCommand('npm', ['install', '-g', 'typescript', '--no-progress', '--loglevel', 'error'], this.outputChannel);
  }

  private static setupMaterializeCss() {
    out.appendLine(this.outputChannel, 'running: Setup MaterializeCss');
    switch (os.platform()) {
      case 'win32':
        exe.runCommand(path.join(vscode.workspace.rootPath, '/node_modules/.bin/r.js.cmd'), ['-o', 'tools/rbuild.js'], this.outputChannel);
        break;
      default:
        exe.runCommand(path.join(vscode.workspace.rootPath, '/node_modules/.bin/r.js'), ['-o', 'tools/rbuild.js'], this.outputChannel);
        break;
    }
    exe.runCommand('au', ['prepare-materialize'], this.outputChannel);
  }
}