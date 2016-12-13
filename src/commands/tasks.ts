import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import exe from '../util/execute';
import out from '../util/output';
import Config from '../data/config';
import * as _ from 'lodash';

interface Task {
  name: string;
  type: string;
  tasks?: string[];
  command?: string;
  args?: string[];
  extension?: string;
}

export default class Tasks {
  constructor(private outputChannel: vscode.OutputChannel, private config: Config) { }

  public async pickScript() {
    let choices: string[] = [ 'Init', 'Build', 'Debug' ];
    let scriptToRun = await vscode.window.showQuickPick(
      choices,
      { matchOnDescription: false, placeHolder: 'Run which script?' }
    );
    if (scriptToRun) {
      this.runScript(scriptToRun.toLowerCase());
    }
  }

  private async runScript(scriptName: string) {
    let taskList = this.getTaskList(scriptName);
    for (let taskName of taskList) {
      let task: Task;
      if (taskName.substr(0,5) === 'team.') {
        task = {
          name: taskName,
          type: "team",
          command: taskName.split('.')[1]
        };
      } else {
        task = this.getTask(taskName);
      }
      this.outputChannel.show();
      out.appendLine(this.outputChannel, `Running: ${taskName}`);
      await this.runTask(task);
    }
  }

  private getTaskList(scriptName: string): string[] {
    let script = this.config.teamConfig['scripts'][scriptName]
    return script['tasks'];
  }

  private getTask(taskName: string): Task {
    return this.config.teamConfig['scripts']['tasks'][taskName];
  }

  private runTask(task: Task) {
    switch (task.type) {
      case 'team':
        this[task.command]();
        break;
      case 'code':
        exe.runCodeTask(task, this.outputChannel);
        break;
    }
  }

  public async runTaskOrig(taskName?: string) {
    let taskToRun: string;
    if (taskName) {
      taskToRun = taskName;
    } else {
      let choices: string[] = [];['commands'];
      let tasks = _.filter(this.config.teamConfig['tasks'], { isVisible: true });
      for (let task of tasks) {
        choices.push(task['name']);
      }
      taskToRun = await vscode.window.showQuickPick(
        choices,
        { matchOnDescription: false, placeHolder: 'Run which task?' }
      );
    }
    if (taskToRun) {
      this.outputChannel.show();
      out.appendLine(this.outputChannel, `Running: ${taskToRun}`);
      let task = _.filter(this.config.teamConfig['tasks'], { name: taskToRun })[0];
      if (task && task.hasOwnProperty('preLaunchTasks')) {
        for (let preLaunchTask of task["preLaunchTasks"]) {
          this.runTask(preLaunchTask);
        }
      }
      switch (task['type']) {
        case 'code':
          await exe.runCodeTask(task, this.outputChannel);
          break;
      }
    }
  }

  private async runCommand(): Promise<void> {
    let response = await vscode.window.showQuickPick(
      ['Install project dependencies', 'Setup MaterializeCss', 'Update Extensions', 'Initialize Project (run all)'],
      { matchOnDescription: false, placeHolder: 'Pick a Task:' }
    );
    if (response !== undefined) {
      this.outputChannel.show();
      switch (response) {
        case 'Install project dependencies':
          await this.installNpmDependencies();
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

  private installNpmDependencies() {
    // , '--loglevel', 'error'
    exe.runCommand('npm', ['install', '--no-progress'], this.outputChannel);
  }

  private async installTeamGlobalDependencies() {
    out.appendLine(this.outputChannel, 'running: npm install (team global dependencies)');
    // TODO: get from team config
    await exe.runCommand('npm', ['install', '-g', 'aurelia-cli@0.22.0', '--no-progress', '--loglevel', 'error'], this.outputChannel);
    await exe.runCommand('npm', ['install', '-g', 'typescript', '--no-progress', '--loglevel', 'error'], this.outputChannel);
  }




}