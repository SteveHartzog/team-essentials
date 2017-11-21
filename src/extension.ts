import * as API from './api';
import { Debug } from './debug';
import { Folder } from './folder';
import { selectShell } from './selectShell';

import { debounce } from 'lodash';
import { commands, extensions, window, workspace, Disposable, ExtensionContext, OutputChannel, Uri, WorkspaceFolder } from 'vscode';

let currentOpenFile: string;
let userInfo: any;
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
let isMultiRootWorkspace;
const MessageType = API.Enums.MessageType;

const registerCommands = (context) => {
  const extCommands = [
    commands.registerCommand('teamEssentials.debugStart', Debug.start),
    commands.registerCommand('teamEssentials.debugStop', Debug.stop),
    commands.registerCommand('teamEssentials.filterExplorer', cmd.filterExplorer),
    commands.registerCommand('teamEssentials.applyTeamSettings', cmd.applyTeamSettings),
    commands.registerCommand('teamEssentials.updateExtensions', cmd.updateExtensions),
    commands.registerCommand('teamEssentials.configWizard', cmd.migrationWizard)
  ];
  if (env.isWindows()) {
    extCommands.push(commands.registerCommand('teamEssentials.selectShell', selectShell));
  }

  context.subscriptions.push(...extCommands);
  // On Current Workspace Change
  context.subscriptions.push(
    workspace.onDidOpenTextDocument((e) => {
      // Ignore anything that isn't a file opening
      if (workspace.workspaceFolders && e.uri.scheme === 'file') {
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

function initFolders() {
  // Init all workspaceFolders
  workspace.workspaceFolders.forEach((workspaceFolder) => {
    folders.push(new Folder(workspaceFolder, isMultiRootWorkspace));
    out.log(`Folder('${workspaceFolder.name}'): initialized`);
  });

  // Save the current path as the currentOpenFile?
  const resource = env.getResource();
  currentOpenFile = resource.fsPath;

  // Init & update the statusbar
  statusbar.create();
  const workspaceFolderId = env.getWorkspaceFolderId(resource);
  folders[workspaceFolderId].updateStatusBar();

  out.info('Team Essentials workspace folders initialized.');
}

async function pleaseConfigure() {
  if (workspace.workspaceFolders) {
    const choice = await controls.ShowMessage(API.Enums.MessageType.Warning, 'Please setup Team Essentials first.', ['Run Setup Wizard']);
    if (choice === 'Run Setup Wizard') {
      await API.Wizard.Configuration();
    }
  } else {
    controls.ShowMessage(API.Enums.MessageType.Warning, 'Please open a workspace folder first.');
  }
}

const cmd = {
  versionWelcome: async (userInfo): Promise<boolean> => {
    out.log('Team Essentials: Welcome!');

    const choices = ['View Release Notes'];
    if (userInfo.isLegacyUser) {
      choices.push('Run Migration Wizard');
    }
    choices.push('Never Show Again');
    const choice = await controls.ShowMessage(enums.MessageType.Info, `Welcome to Team Essentials, v${version}`, choices);
    out.continue(`welcome('${choice ? choice : 'Close'}')`);

    if (choice === 'Never Show Again') {
      await config.setGlobal('teamEssentials.disableWelcome', true);
    }

    if (choice === 'View Release Notes') {
      await commands.executeCommand('vscode.open', Uri.parse(releaseNotes));
    }

    if (choice === 'Run Migration Wizard') {
      return await cmd.migrationWizard();
    }
    return userInfo.isCurrentUser;
  },
  migrationWizard: async (): Promise<boolean> => {
    // if inside an open project (single or multi-root)
    if (workspace.workspaceFolders) {
      if (userInfo.isNewUser) {
        userInfo.isCurrentUser = await API.Wizard.Configuration();
        userInfo.isNewUser = !userInfo.isCurrentUser;
        if (userInfo.isCurrentUser) {
          initFolders();
        } else {
          return false;
        }
      }

      if (workspace.workspaceFolders.length > 0) {
        const migrationTargets: WorkspaceFolder[] = new Array();
        workspace.workspaceFolders.forEach((workspaceFolder) => {
          if (env.hasOldConfig(workspaceFolder.name, workspaceFolder.uri.fsPath)) {
            migrationTargets.push(workspaceFolder);
          }
        });
        // if migration is possible
        if (migrationTargets.length > 0) {
          return await API.Wizard.MigrateConfiguration(migrationTargets);
        }
      }
    } else {
      pleaseConfigure();
      return false;
    }
  },
  filterExplorer: async () => {
    if (!userInfo.isNewUser) {
      const resource = env.getResource();
      folders[env.getWorkspaceFolderId(resource)].filterExplorer();
    } else {
      pleaseConfigure();
    }
  },
  applyTeamSettings: () => {
    if (!userInfo.isNewUser) {
      const resource = env.getResource();
      folders[env.getWorkspaceFolderId(resource)].applyTeamSettings();
    } else {
      pleaseConfigure();
    }
  },
  updateExtensions: () => {
    if (!userInfo.isNewUser) {
      const resource = env.getResource();
      const folder = folders[env.getWorkspaceFolderId(resource)];
      if (folder) {
        folder.updateExtensions();
      }
    } else {
      pleaseConfigure();
    }
  }
};

// Team Essentials entry point
export const activate = async (context: ExtensionContext) => {
  // Initialize the output channel
  out.startChannel();

  isMultiRootWorkspace = env.isMultiRootWorkspace();
  userInfo = env.getUserInfo();

  registerCommands(context);

  // For activation in vscode only with an open folder
  if (workspace.workspaceFolders) {
    out.info('Team Essentials: Detected open folder.');
    if (userInfo.isNewUser) { // Activation by way of requesting configWizard
      userInfo.isCurrentUser = await API.Wizard.Configuration();
      userInfo.isNewUser = !userInfo.isCurrentUser;
    } else { // Activation by way of User already having a config
      const currentlyInstalledVersion = config.getGlobal('teamEssentials.currentVersion');
      let disableWelcome = config.getGlobal('teamEssentials.disableWelcome');
      disableWelcome = disableWelcome === undefined ? false : disableWelcome;

      if (!disableWelcome) { // && currentlyInstalledVersion !== version) {
        config.setGlobal('teamEssentials.currentVersion', version);
        userInfo.isCurrentUser = await cmd.versionWelcome(userInfo);
        userInfo.isLegacyUser = !userInfo.isCurrentUser;
      }
    }

    if (userInfo.isCurrentUser || userInfo.isLegacyUser) {
      initFolders();
    }
  }
};

export const deactivate = () => { };