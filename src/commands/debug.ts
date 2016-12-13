import * as vscode from 'vscode';
import out from '../util/output';
import Config from '../data/config';

export default class Debug {
  debugStart;
  debugStop;

  constructor(private outputChannel: vscode.OutputChannel, private config: Config) {
    if (this.config.teamConfig.hasOwnProperty('debug') && this.config.teamConfig['debug'].hasOwnProperty('start')) {
        this.debugStart = this.config.teamConfig['debug']['start'];
    } else {
      this.debugStart = {
        output: 'workbench.debug.action.focusRepl',
        explorer: 'workbench.view.debug'
      };  
    }
      
    if (this.config.teamConfig.hasOwnProperty('debug') && this.config.teamConfig['debug'].hasOwnProperty('stop')) {
        this.debugStop = this.config.teamConfig['debug']['stop'];
    } else {
      this.debugStop = {
        output: 'workbench.action.output.toggleOutput',
        explorer: 'workbench.view.explorer',
        terminatePreLaunchTask: true
      };
    }
  }

  public async start() {
    // Show Debug Console
    vscode.commands.executeCommand(this.debugStart.output);

    // Switch to Debug View
    vscode.commands.executeCommand(this.debugStart.explorer);
  }

  public async stop() {
    // Stop server debugger
    await vscode.commands.executeCommand('workbench.action.debug.stop');

    // Switch output
    if (this.debugStop.output.toLowerCase() === "teamessentials") {
      this.outputChannel.show();
    } else {
      vscode.commands.executeCommand(this.debugStop.output);
    }

    // Terminate watcher tasks
    if (this.debugStop.terminatePreLaunchTask) {
      await vscode.commands.executeCommand('workbench.action.tasks.terminate');
    }

    // Switch Explorer View
    vscode.commands.executeCommand(this.debugStop.explorer);

  }
}