import * as vscode from 'vscode';
import * as cp from 'child_process';
import { runInTerminal } from 'run-in-terminal';
import output from './output';


export default class Execute {
  public static runCommand(cmd: string, args: string[], outputChannel: vscode.OutputChannel, useTerminal?: boolean): void {
    let cwd = vscode.workspace.rootPath;
    if (useTerminal) {
      this.runCommandInTerminal(cmd, args, cwd);
    } else {
      this.runCommandInOutputWindow(cmd, args, cwd, outputChannel);
    }
  }

  public static runCommandInOutputWindow(cmd: string, args: string[], cwd: string, outputChannel: vscode.OutputChannel) {
    let command = cmd + ' ' + args.join(' ');
    let childProcess = cp.exec(command, { cwd: cwd, env: process.env });
    childProcess.stderr.on('data', data => outputChannel.append(<string>data));
    childProcess.stdout.on('data', data => outputChannel.append(<string>data));

    output.show(outputChannel);
  }

  public static runCommandInTerminal(cmd: string, args: string[], cwd: string): void {
    runInTerminal(cmd, args, { cwd: cwd, env: process.env });
  }

}