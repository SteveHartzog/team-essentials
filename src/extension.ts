'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ExtensionContext, window, OutputChannel } from 'vscode';
import { runInTerminal } from 'run-in-terminal';
import Commands from './commands/index';

let outputChannel: OutputChannel;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {

    // Create default output channel
    outputChannel = window.createOutputChannel('Team Essentials');
    context.subscriptions.push(outputChannel);
    let commands = new Commands(outputChannel);

    // Register Commands
    context.subscriptions.push(commands.register());

}

// this method is called when your extension is deactivated
export function deactivate() {
}