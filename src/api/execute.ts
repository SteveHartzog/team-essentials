import { OutputChannel, commands, extensions } from 'vscode';
import { exec } from 'child_process';
import { runInTerminal } from 'run-in-terminal';
import * as UI from './ui';

export default class Execute {

  public static runCommand(cmd: string, dir, args: string[]): void {
    let output = UI.Output;

    let command = cmd + ' ' + args.join(' ');
    let childProcess = exec(command, { cwd: dir, env: process.env });
    childProcess.stderr.on('data', data => output.error(<string>data));
    childProcess.stdout.on('data', data => output.error(<string>data));
  }
  // else {
  //   runInTerminal(cmd, args, { cwd: dir, env: process.env });
  // }

  // public static async runCodeTask(task, outputChannel) {
  //   if (task['command'].substr(0, 6) !== 'vscode') {
  //     let extension = extensions.getExtension(task['extension'])
  //     if (extension === undefined) {
  //       out.appendLine(outputChannel, `Not Found: ${task['extension']}`);
  //     } else {
  //       await commands.executeCommand(`${task['command']}`);
  //     }
  //   } else {
  //     await commands.executeCommand(task['command']);
  //   }
  // }
}