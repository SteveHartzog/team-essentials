import * as vscode from 'vscode';
import * as cp from 'child_process';
import { runInTerminal } from 'run-in-terminal';
import out from './output';


export default class Execute {

  public static runCommand(cmd: string, args: string[], outputChannel?: vscode.OutputChannel): void {
    if (outputChannel) {
      let command = cmd + ' ' + args.join(' ');
      let childProcess = cp.exec(command, { cwd: vscode.workspace.rootPath, env: process.env });
      childProcess.stderr.on('data', data => outputChannel.append(<string>data));
      childProcess.stdout.on('data', data => outputChannel.append(<string>data));

      out.show(outputChannel);
    } else {
      runInTerminal(cmd, args, { cwd: vscode.workspace.rootPath, env: process.env });
    }
  }

  public static async runCodeTask(task, outputChannel) {
    if (task['command'].substr(0, 6) !== 'vscode') {
      let extension = vscode.extensions.getExtension(task['extension'])
      if (extension === undefined) {
        out.appendLine(outputChannel, `Not Found: ${task['extension']}`);
      } else {
        await vscode.commands.executeCommand(`extension.${task['command']}`);
      }
    } else {
      await vscode.commands.executeCommand(task['command']);
    }
  }

}