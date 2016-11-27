import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import exe from './util/execute';
import out from './util/output';
import * as _ from 'lodash';

export default class Init {
  private static teamConfigPath: string;
  private static teamConfig: JSON;
  private static outputChannel: vscode.OutputChannel;

  private static async runCommand(): Promise<void> {
    let response = await vscode.window.showQuickPick(
      ['Install npm dependencies', 'Setup MaterializeCss', 'Update Extensions', 'Initialize Project (run all)'],
      { matchOnDescription: false, placeHolder: 'Pick a Task:' }
    );
    if (response !== undefined) {
      this.outputChannel.show();
      switch (response) {
        case 'Install npm dependencies':
          // this.installDependencies(); // init.ts/installDependencies()
          break;
        case 'Setup MaterializeCss':
          // this.setupMaterializeCss(); // init.ts/setupMaterializeCss()
          break;
        case 'Update Extensions':
          // this.updateExtensions();
          break;
        case 'Initialize Project (run all)':
          // this.Init(); // init.ts/init()
          break;
      }
    }
  }

  private static async runTask(taskName?: string) {
    let taskToRun: string;
    if (taskName !== undefined) {
      taskToRun = taskName;
    } else {
      let choices: string[] = [];
      let tasks = _.filter(this.teamConfig['tasks'], { isVisible: true });
      for (let task of tasks) {
        choices.push(task['name']);
      }
      taskToRun = await vscode.window.showQuickPick(
        choices,
        { matchOnDescription: false, placeHolder: 'Run which task?' }
      );
    }
    if (taskToRun !== undefined) {
      this.outputChannel.show();
      out.appendLine(this.outputChannel, `Running: ${taskToRun}`);
      let task = _.filter(this.teamConfig['tasks'], { name: taskToRun })[0];
      if (task && task.hasOwnProperty('preLaunchTasks')) {
        for (let preLaunchTask of task["preLaunchTasks"]) {
          this.runTask(preLaunchTask);
        }
      }
      switch (task['type']) {
        case 'code':
          await this.runCodeTask(task);
          break;
      }
    }
  }

  private static async runCodeTask(task) {
    if (task['command'].substr(0, 6) !== 'vscode') {
      let extension = vscode.extensions.getExtension(task['extension'])
      if (extension === undefined) {
        out.appendLine(this.outputChannel, `Not Found: ${task['extension']}`);
      } else {
        // if (!extension.isActive) {
        //   extension.activate();
        // }
        await vscode.commands.executeCommand(`extension.${task['command']}`);
      }
    } else {
      await vscode.commands.executeCommand(task['command']);
    }
  }


}