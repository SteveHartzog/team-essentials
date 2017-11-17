import { join } from 'path';
import { commands, workspace, Uri, WorkspaceFolder } from 'vscode';
import * as API from './index';

export async function NewUserConfiguration() {
  const folderPath = API.Environment.getRootFolderPath();

  const config = API.Configuration;
  const env = API.Environment;
  const out = API.UI.Output;
  const controls = API.UI.Controls;
  const Choice = API.UI.Choice;
  const MessageType = API.Enums.MessageType;

  // Offer to setup for first time user
  await controls.ShowChoices('Team Essentials: New User Wizard > Would you like to continue?', [
    new Choice('No', 'Please don\'t add any configuration for me.'),
    new Choice('Yes', 'Add configurations for explorer filters, debug layouts, and team defaults (settings).',
      'The wizard will create a (4) configuration files.')
  ], async (choice) => {
    out.log(`Automatic configuration requested...`);
    if (choice && choice.label === 'Yes') {
      // Create & Save default configs
      await workspace.workspaceFolders.forEach(async (folder: WorkspaceFolder) => {
        const configDir = join(folder.uri.fsPath, '.vscode/team-essentials');
        if (env.createDirectory(configDir)) {
          out.log(`Team Essentials folder created @ '${configDir}`);
          config.createDefaultConfigs(folder.uri.fsPath);
          out.log(`Configurations created for explorer filters, debug layouts and team defaults (settings).`);

          // Update .gitignore for the user if allowed.
          if (env.confirmPath(join(folder.uri.fsPath, '.git')) && env.confirmPath(join(folder.uri.fsPath, '.gitignore'))) {
            await controls.ShowChoices('Team Essentials: New User Setup > Update .gitignore?', [
              new Choice('No', 'Please don\'t update my .gitignore.',
                'You can always modify this yourself, but until then explorer filter changes will be committed.'),
              new Choice('Yes', 'Update my .gitignore to exclude Team Essentials\'s `state.json` and vscode\'s `settings.json` for me.',
                'These are necessary so that each team developer can select their own explorer filter.')
            ], (choice) => {
              let completionMessage;
              if (choice && choice.label === 'Yes') {
                out.log(`Updating .gitignore...`);
                config.insertGitIgnoreSettings(folder.uri.fsPath);
                completionMessage = 'Setup complete! Please see the docs for how to customize the config.';
              } else {
                completionMessage = 'Please update your `.gitignore` so explorer filters will not be committed.';
              }
              controls.ShowMessage(MessageType.Info, completionMessage, ['View Documentation']).then((choice) => {
                if (choice && choice === 'View Documentation') {
                  commands.executeCommand('vscode.open', Uri.parse('https://github.com/SteveHartzog/team-essentials/wiki'));
                }
              });
            });
          }
        }
      });
    } else {
      await controls.ShowMessage(MessageType.Info, 'Your setup was canceled.', ['View Documentation']).then((choice) => {
        if (choice && choice === 'View Documentation') {
          commands.executeCommand('vscode.open', Uri.parse('https://github.com/SteveHartzog/team-essentials/wiki'));
        }
      });
    }

  });
}

export async function MigrateConfiguration(folders: WorkspaceFolder[], reload = false) {
  const config = API.Configuration;
  const controls = API.UI.Controls;
  const MessageType = API.Enums.MessageType;
  const Choice = API.UI.Choice;
  const choices = [
    new Choice('No', 'Don\'t migrate my configuration automatically.'),
    new Choice('Yes', 'Migrate my configuration automatically.',
      'This will migrate your configuration into the `.vscode/team-essentials` folder.')
  ];

  await controls.ShowChoices('Team Essentials: Would you like to migrate this workspace to the new configuration now?', choices, (choice) => {
    let completionMessage = '';
    if (choice && choice.label === 'Yes') {
      folders.forEach(async (folder) => {
        config.migrateConfigs(folder.uri.fsPath);
      });
      completionMessage = 'Setup complete! Please see the docs for how to customize the config.';
    } else {
      completionMessage = 'Your configuration migration was canceled.';
    }
    controls.ShowMessage(MessageType.Info, completionMessage, ['View Documentation']).then((choice) => {
      if (choice && choice === 'View Documentation') {
        commands.executeCommand('vscode.open', Uri.parse('https://github.com/SteveHartzog/team-essentials/wiki'));
      }
    });
  });
}