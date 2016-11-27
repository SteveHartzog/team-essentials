import * as vscode from 'vscode';
import out from './util/output';

export default class KeyBindings {
  public static registerKeybindings(outputChannel: vscode.OutputChannel): vscode.Disposable {
    return vscode.Disposable.from(
      vscode.commands.registerCommand('extension.debugStart', () => this.debugStart(outputChannel)),
      vscode.commands.registerCommand('extension.debugStop', () => this.debugStop(outputChannel))
    );
  }

  private static async debugStart(outputChannel: vscode.OutputChannel) {
    outputChannel.show();
    out.appendLine(outputChannel, 'starting: Debugger');

    // Start client debugger
    // await vscode.commands.executeCommand('extension.auRun');

    // Show Debug Console
    vscode.commands.executeCommand('workbench.debug.action.focusRepl');

    // Switch to Debug View
    vscode.commands.executeCommand('workbench.view.debug');

    // Start server debugger
    // let success = await vscode.commands.executeCommand('vscode.startDebug');
  }

  private static async debugStop(outputChannel: vscode.OutputChannel) {
    outputChannel.show();
    out.appendLine(outputChannel, 'stopping: Debugger');

    // Stop client debugger
    // await vscode.commands.executeCommand('workbench.action.tasks.terminate');

    // Stop server debugger
    // let success = await vscode.commands.executeCommand('workbench.action.debug.stop');

    // Hide Debug Console
    vscode.commands.executeCommand('workbench.debug.action.toggleRepl');

    // Switch Explorer View
    vscode.commands.executeCommand('workbench.view.explorer');
  }
}