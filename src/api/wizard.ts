import { join } from 'path';
import { commands, workspace, Uri, WorkspaceFolder } from 'vscode';
import * as API from './index';

export async function Configuration(): Promise<boolean> {
  const folderPath = API.Environment.getRootFolderPath();

  const config = API.Configuration;
  const env = API.Environment;
  const out = API.UI.Output;
  const controls = API.UI.Controls;
  const Choice = API.UI.Choice;
  const MessageType = API.Enums.MessageType;

  const result = await controls.ShowMessage(MessageType.Info, 'Welcome to Team Essentials!', ['Configuration Wizard']);
  if (result === undefined) {
    return false;
  }

  const shouldContinue: string = await controls.ShowChoices(`Configuration Wizard > Should we add the .vscode configuration files? `, [
    new Choice('No', 'Cancel the New User wizard and do not add any configuration.'),
    new Choice('Yes', 'Add configurations for explorer filters, debug layouts, and team defaults (settings).',
      'The wizard will create (3) configuration files.')
  ]);
  if (shouldContinue === 'Yes') {
    const updateGitIgnores = await controls.ShowChoices('Configuration Wizard > Update the .gitignore for all folders?', [
      new Choice('No', 'Please don\'t update any .gitignore files.',
        'Explorer filter changes will be committed.'),
      new Choice('Yes', 'Create and update all .gitignore files.',
        'This will create entries necessary to support the explorer filter.')
    ]);
    out.info(`Congiuration Wizard started.`);
    out.continue(`Configuration files: ${shouldContinue}`);
    out.continue(`Update .gitignore files: ${updateGitIgnores}`);
    // Add Configs
    workspace.workspaceFolders.forEach((folder: WorkspaceFolder) => {
      const vscodeDir = join(folder.uri.fsPath, '.vscode');
      const configDir = join(folder.uri.fsPath, '.vscode/team-essentials');
      if (env.createDirectory(vscodeDir) && env.createDirectory(configDir)) {
        out.log(`Team Essentials folder created @ '${configDir}`);
        config.createDefaultConfigs(folder.uri.fsPath);
        out.log('Configurations created for explorer filters, debug layouts and team defaults (settings).');
      }
      if (updateGitIgnores === 'Yes') {
        out.log(`Updating .gitignore...`);
        // Update .gitignore for the user if allowed.
        config.insertGitIgnoreSettings(folder.uri.fsPath);
      }
    });
    out.log('New User Wizard complete');
    const result = await controls.ShowMessage(MessageType.Info, updateGitIgnores
      ? 'Setup complete! Please see the docs for how to customize this workspace.'
      : 'Please update all .gitignore files so that the explorer filters will not be committed.',
      ['View Documentation']);
    if (result === 'View Documentation') {
      commands.executeCommand('vscode.open', Uri.parse('https://github.com/SteveHartzog/team-essentials/wiki'));
    }
    return shouldContinue === 'Yes' && updateGitIgnores === 'Yes';
  } else {
    const result = await controls.ShowMessage(MessageType.Warning, 'Your setup was canceled and Team Essentials was not configured.', ['View Documentation']);
    if (result === 'View Documentation') {
      commands.executeCommand('vscode.open', Uri.parse('https://github.com/SteveHartzog/team-essentials/wiki'));
    }
    return false;
  }
}

export async function MigrateConfiguration(folders: WorkspaceFolder[], reload = false): Promise<boolean> {
  const config = API.Configuration;
  const controls = API.UI.Controls;
  const MessageType = API.Enums.MessageType;
  const Choice = API.UI.Choice;

  const migrateNow = await controls.ShowChoices('Team Essentials: Migration Wizard. Run it now?', [
    new Choice('No', 'Don\'t migrate my configuration automatically.'),
    new Choice('Yes', 'Migrate my configuration automatically.',
      'This will migrate your configuration into the `.vscode/team-essentials` folder.')
  ]);
  let completionMessage = '';
  let hasMigrated = false;
  if (migrateNow === 'Yes') {
    folders.forEach(async (folder) => {
      config.migrateConfigs(folder.uri.fsPath);
    });
    hasMigrated = true;
    completionMessage = 'Setup complete! Please see the docs for how to customize the config.';
  } else {
    completionMessage = 'Your configuration migration was canceled.';
  }
  const result = await controls.ShowMessage(MessageType.Info, completionMessage, ['View Documentation']);
  if (result === 'View Documentation') {
    commands.executeCommand('vscode.open', Uri.parse('https://github.com/SteveHartzog/team-essentials/wiki'));
    return hasMigrated;
  }
}