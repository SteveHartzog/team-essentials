import { commands } from 'vscode';
import * as API from './api';

const controls = API.UI.Controls;
const Choice = API.UI.Choice;
const config = API.Configuration;

enum Shell {
  CommandPrompt = 'Command Prompt',
  PowerShell = 'PowerShell',
  GitBash = 'Git Bash',
  BashOnUbuntu = 'Bash on Ubuntu',
  Cmder = 'cmder',
  HyperWithCmd = 'Hyper.is (cmd.exe)',
  HyperWithBash = 'Hyper.is (bash.exe)'
}

enum ShellLocations {
  CommandPrompt = 'C:\\Windows\\sysnative\\cmd.exe',
  PowerShell = 'C:\\Windows\\sysnative\\WindowsPowerShell\\v1.0\\powershell.exe',
  GitBash = 'C:\\Program Files\\Git\\bin\\bash.exe',
  BashOnUbuntu = 'C:\\Windows\\sysnative\\bash.exe',
  // Future support?
  Cmder = '',
  HyperWithCmd = 'C:\\Windows\\sysnative\\cmd.exe',
  HyperWithBash = 'C:\\WINDOWS\\Sysnative\\bash.exe'
}

export async function selectShell() {
  const shell = await controls.ShowChoices('Select your Windows shell:', [
    new Choice(Shell.CommandPrompt, 'Just the basics.'),
    new Choice(Shell.PowerShell, 'Microsoft PowerShell is an object oriented shell.'),
    new Choice(Shell.GitBash, 'Installed with the git-scm client.'),
    new Choice(Shell.BashOnUbuntu, 'The Ubuntu Bash shell that uses the Windows Subsystem for Linux.')
  ]);
  let cli;
  if (shell) {
    switch (shell) {
      case Shell.CommandPrompt:
        cli = ShellLocations.CommandPrompt;
        break;
      case Shell.PowerShell:
        cli = ShellLocations.PowerShell;
        break;
      case Shell.GitBash:
        cli = ShellLocations.GitBash;
        break;
      case Shell.BashOnUbuntu:
        cli = ShellLocations.BashOnUbuntu;
        break;
    }
    if (cli) {
      const workspaceShell = config.getGlobal('terminal.integrated.shell.windows');
      if (cli !== workspaceShell) {
        // Save to workspace in multi-root, global if not
        config.setGlobal('terminal.integrated.shell.windows', cli);
        _restartShell();
      }
    }
  }
}

function _restartShell() {
  // only kill if it has been opened?
  commands.executeCommand('workbench.action.terminal.focus').then(() => {
    commands.executeCommand('workbench.action.terminal.kill').then(() => {
      // Add a .5 sec timeout to give it a chance to ensure kill is completed
      setTimeout(() => {
        commands.executeCommand('workbench.action.terminal.focus');
      }, 500);
    });
  });
}