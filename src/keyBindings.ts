import * as vscode from 'vscode';
import out from './util/output';

export default class Keybindings {
  constructor(private outputChannel: vscode.OutputChannel) { }

  public register(): vscode.Disposable {
    return vscode.Disposable.from(
      vscode.commands.registerCommand('teamEssentials.debugStart', () => this.debugStart()),
      vscode.commands.registerCommand('teamEssentials.debugStop', () => this.debugStop())
    );
  }

  private async debugStart() {
    // Start client debugger
    // await vscode.commands.executeCommand('extension.auRun');

    // Show Debug Console
    vscode.commands.executeCommand('workbench.debug.action.focusRepl');

    // Switch to Debug View
    vscode.commands.executeCommand('workbench.view.debug');
  }

  private async debugStop() {
    // Stop client debugger
    // await vscode.commands.executeCommand('workbench.action.tasks.terminate');

    // Stop server debugger
    await vscode.commands.executeCommand('workbench.action.debug.stop');

    // Switch Explorer View
    vscode.commands.executeCommand('workbench.view.explorer');

    // Switch output to Team Essentials
    this.outputChannel.show();
  }
}