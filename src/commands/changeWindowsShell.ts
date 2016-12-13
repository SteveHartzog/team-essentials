import * as vscode from 'vscode';
import * as os from 'os';
import Config from '../data/config';

export default class ChangeWindowsShell {
  constructor(private config: Config) {
    if (this.config.userConfig.hasOwnProperty('terminal')) {
      let chosenCli = this.config.userConfig['terminal'];
      if (this.config.workspaceSettings.hasOwnProperty('terminal.integrated.shell.windows')) {
        let currentCli = this.config.workspaceSettings['terminal.integrated.shell.windows'];
        if (chosenCli !== currentCli) {
          this.config.workspaceSettings['terminal.integrated.shell.windows'] = chosenCli;
          this.config.saveWorkspaceSettings();
        }
      } else {
        this.config.workspaceSettings['terminal.integrated.shell.windows'] = chosenCli;
        this.config.saveWorkspaceSettings();
      }
    }
  }

  public applyShell() {
    if (os.platform() === 'win32') {
      this.applyWindowsShell();
    }
  }

  private applyWindowsShell() {
    vscode.window.showQuickPick(
      ['Command Prompt', 'PowerShell', 'Bash on Ubuntu'],
      { matchOnDescription: false, placeHolder: 'Which shell?' }
    ).then((choice: string) => {
      let cli;
      switch (choice) {
        case 'Command Prompt':
          cli = "C:\\Windows\\sysnative\\cmd.exe";
          break;
        case 'PowerShell':
          cli = 'C:\\Windows\\sysnative\\WindowsPowerShell\\v1.0\\powershell.exe';
          break;
        case 'Bash on Ubuntu':
          cli = 'C:\\Windows\\sysnative\\bash.exe';
          break;
      }
      if (cli.length > 0) {
        // Save to user settings
        this.config.workspaceSettings['terminal.integrated.shell.windows'] = cli;
        this.config.saveWorkspaceSettings();

        // Save to user saves
        this.config.userConfig['terminal'] = cli;
        this.config.saveUserConfig();

        // Notify user to restart VS Code
        // vscode.window.showInformationMessage('Restart Code to see your chosen integrated terminal.');
      }
    });
  }
}