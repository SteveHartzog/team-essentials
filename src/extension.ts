import * as API from './api';
import { Debug } from './debug';
import { Folder } from './folder';

import { debounce } from 'lodash';
import { commands, extensions, window, workspace, Disposable, ExtensionContext, OutputChannel, Uri, WorkspaceFolder } from 'vscode';

let currentOpenFile: string;
const folders: Folder[] = new Array();
const ext = extensions.getExtension('SteveHartzog.team-essentials')!;
const version = ext.packageJSON.version;
// const changelog = 'https://marketplace.visualstudio.com/items/SteveHartzog.team-essentials/changelog';
const releaseNotes = 'https://github.com/SteveHartzog/team-essentials/wiki/Release-Notes';

// API Dependencies
const controls = API.UI.Controls;
const statusbar = API.UI.Statusbar;
const env = API.Environment;
const config = API.Configuration;
const enums = API.Enums;
const out = API.UI.Output;
const isMultiRootWorkspace = env.isMultiRootWorkspace();
const MessageType = API.Enums.MessageType;

const welcome = async () => {
  out.log('Team Essentials: Welcome!');

  await controls.ShowMessage(enums.MessageType.Info, `Welcome to Team Essentials, v${version}`, ['View Release Notes', 'Run Configuration Wizard', 'Never Show Again']).then(async (value) => {
    out.continue(`welcome('${value}')`);
    switch (value) {
      case 'Never Show Again':
        await config.setGlobal('teamEssentials.disableWelcome', true);
        break;

      case 'View Release Notes':
        await commands.executeCommand('vscode.open', Uri.parse(releaseNotes));
        break;

      case 'Run Configuration Wizard':
        await cmd.getWizard();
        break;
    }
  });
};

const emptyRegister = (context) => {
  const notSetup = () => {
    controls.ShowMessage(API.Enums.MessageType.Warning, 'Please setup Team Essentials first.', ['Run Setup Wizard']).then((choice) => {
      if (choice === 'Run Setup Wizard') {
        cmd.getWizard();
      }
    });
  };
  const doNothing = () => { return; };

  const extCommands = [
    commands.registerCommand('teamEssentials.debugStart', doNothing),
    commands.registerCommand('teamEssentials.debugStop', doNothing),
    commands.registerCommand('teamEssentials.filterExplorer', notSetup),
    commands.registerCommand('teamEssentials.applyTeamSettings', notSetup),
    commands.registerCommand('teamEssentials.updateExtensions', notSetup),
    commands.registerCommand('teamEssentials.selectShell', notSetup),
    commands.registerCommand('teamEssentials.configWizard', cmd.getWizard)
  ];

  context.subscriptions.push(Disposable.from(...extCommands));
};

const fullRegister = (context) => {
  // Init the statusbar if filters have been setup
  statusbar.create();

  const extCommands = [
    commands.registerCommand('teamEssentials.debugStart', Debug.start),
    commands.registerCommand('teamEssentials.debugStop', Debug.stop),
    commands.registerCommand('teamEssentials.filterExplorer', cmd.filterExplorer),
    commands.registerCommand('teamEssentials.applyTeamSettings', cmd.applyTeamSettings),
    commands.registerCommand('teamEssentials.updateExtensions', cmd.updateExtensions),
    commands.registerCommand('teamEssentials.configWizard', cmd.getWizard)
  ];

  if (env.isWindows()) {
    extCommands.push(commands.registerCommand('teamEssentials.selectShell', cmd.selectShell));
  }

  // Register Commands
  context.subscriptions.push(...extCommands);

  // Init all workspaceFolders
  workspace.workspaceFolders.forEach((workspaceFolder) => {
    folders.push(new Folder(workspaceFolder, isMultiRootWorkspace));
    out.info(`Folder('${workspaceFolder.name}'): initialized`);
  });

  // UpdateStatusbar to show it even if no document is open
  const resource = env.getResource();
  const workspaceFolderId = env.getWorkspaceFolderId(resource);
  folders[workspaceFolderId].updateStatusBar();
  currentOpenFile = resource.fsPath;

  // On Current Workspace Change
  context.subscriptions.push(
    workspace.onDidOpenTextDocument((e) => {
      // Ignore anything that isn't a file opening
      if (e.uri.scheme === 'file') {
        // Ensure that this is a new document (not opening the same document n-times)
        if (e.uri.fsPath !== currentOpenFile) {
          const workspaceFolderId = env.getWorkspaceFolderId(e.uri);
          folders[workspaceFolderId].updateStatusBar();
          currentOpenFile = e.uri.fsPath;
        }
      }
    })
  );
};

const cmd = {
  getWizard: async () => {
    // if inside an open project (single or multi-root)
    if (workspace.workspaceFolders.length > 0) {
      const migrationTargets: WorkspaceFolder[] = new Array();
      workspace.workspaceFolders.forEach((workspaceFolder) => {
        if (env.hasOldConfig(workspaceFolder.name, workspaceFolder.uri.fsPath)) {
          migrationTargets.push(workspaceFolder);
        }
      });
      // if there is at least one migration possible, otherwise you are a new user
      if (migrationTargets.length > 0) {
        await API.Wizard.MigrateConfiguration(migrationTargets);
      } else {
        await API.Wizard.NewUserConfiguration();
      }
    }
    return;
  },
  filterExplorer: () => {
    const resource = env.getResource();
    folders[env.getWorkspaceFolderId(resource)].filterExplorer();
  },
  applyTeamSettings: () => {
    const resource = env.getResource();
    folders[env.getWorkspaceFolderId(resource)].applyTeamSettings();
  },
  updateExtensions: () => {
    const resource = env.getResource();
    const folder = folders[env.getWorkspaceFolderId(resource)];
    if (folder) {
      folder.updateExtensions();
    }
  },
  selectShell: () => {
    const resource = env.getResource();
    folders[env.getWorkspaceFolderId(resource)].selectShell();
  }
};

// Team Essentials entry point
export const activate = (context: ExtensionContext) => {
  console.log('Team Essentials activated!');
  // Initialize the output channel
  out.setChannel(window.createOutputChannel('Team Essentials'));
  out.setLogLevel(config.getLogLevel(env.isMultiRootWorkspace()));
  out.info('Team Essentials starting.');

  const currentlyInstalledVersion = config.getGlobal('teamEssentials.currentVersion');
  let disableWelcome = config.getGlobal('teamEssentials.disableWelcome');
  disableWelcome = disableWelcome === undefined ? false : disableWelcome;

  if (!disableWelcome && currentlyInstalledVersion !== version) {
    config.setGlobal('teamEssentials.currentVersion', version);

    welcome().then(() => {
      out.continue('Welcome completed, now activating features.');
      // Ensure config/migration happened in welcome
      if (API.Environment.isNewUser()) {
        emptyRegister(context);
      } else {
        fullRegister(context);
      }
    });
  } else {
    fullRegister(context);
  }
};

export const deactivate = () => { };