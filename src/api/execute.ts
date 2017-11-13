import { OutputChannel, commands, extensions } from 'vscode';
import { exec } from 'child_process';
import { runInTerminal } from 'run-in-terminal';
import * as UI from './ui';

export function runCommand(cmd: string, dir, args: string[]): void {
  let output = UI.Output;

  let command = cmd + ' ' + args.join(' ');
  let childProcess = exec(command, { cwd: dir, env: process.env });
  childProcess.stderr.on('data', data => output.error(<string>data));
  childProcess.stdout.on('data', data => output.info(<string>data));
}