import { exec } from 'child_process';
import { runInTerminal } from 'run-in-terminal';
import { commands, extensions, OutputChannel } from 'vscode';
import * as UI from './ui';

export function runCommand(cmd: string, dir, args: string[]): void {
  const output = UI.Output;

  const command = `${cmd} ${args.join(' ')}`;
  const childProcess = exec(command, { cwd: dir, env: process.env });
  childProcess.stderr.on('data', (data) => output.error(data as string));
  childProcess.stdout.on('data', (data) => output.info(data as string));
}