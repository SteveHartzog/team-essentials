import * as vscode from 'vscode';

export default class Output {
  private static statusBarItem: vscode.StatusBarItem;

  public static show(outputChannel: vscode.OutputChannel): void {
    outputChannel.show(vscode.ViewColumn.One);
  }

  public static appendLine(outputChannel: vscode.OutputChannel, content: string, withNewline?: boolean) {
    if (withNewline) {
      outputChannel.appendLine(`\n${content}`);
    } else {
      outputChannel.appendLine(`${content}`);
    }
  }

  public static createStatusBar() {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    this.statusBarItem.command = 'teamEssentials.filterExplorer';
    this.statusBarItem.tooltip = "Click to change the explorer filter";
  }

  public static updateStatusBar(status: string) {
    this.statusBarItem.text = '$(repo)  ' + status;
    this.statusBarItem.show();
  }
}