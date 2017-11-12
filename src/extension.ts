import { commands, Disposable, extensions, ExtensionContext, workspace, window, OutputChannel, Uri, WorkspaceFolder } from 'vscode';
import Folder from './folder';
import Debug from './debug';
import * as API from './api';

let currentOpenFile: string;
const folders: Folder[] = new Array();
const ext = extensions.getExtension('SteveHartzog.team-essentials')!;
const version = ext.packageJSON.version;
// const changelog = 'https://marketplace.visualstudio.com/items/SteveHartzog.team-essentials/changelog';
const releaseNotes = 'https://github.com/SteveHartzog/team-essentials/wiki/Multi-Root-Update';

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
        await config.setGlobal('disableWelcome', true);
        break;

      case 'View Release Notes':
        await commands.executeCommand('vscode.open', Uri.parse(releaseNotes));
        break;

      case 'Run Configuration Wizard':
        await cmd.getWizard();
        break;
    }
  });
}

const emptyRegister = (context) => {
  const notSetup = () => {
    controls.ShowMessage(API.Enums.MessageType.Warning, 'Please setup Team Essentials first.', ['Run Setup Wizard']).then((choice) => {
      if (choice === 'Run Setup Wizard') {
        cmd.getWizard();
      }
    });
  }
  const doNothing = () => { return; };

  const extCommands = [
    commands.registerCommand("teamEssentials.debugStart", () => doNothing()),
    commands.registerCommand("teamEssentials.debugStop", () => doNothing()),
    commands.registerCommand("teamEssentials.filterExplorer", () => notSetup()),
    commands.registerCommand("teamEssentials.applyTeamSettings", () => notSetup()),
    commands.registerCommand("teamEssentials.updateExtensions", () => notSetup()),
    commands.registerCommand("teamEssentials.selectShell", () => notSetup()),
    commands.registerCommand('teamEssentials.configWizard', () => cmd.getWizard())
  ];

  context.subscriptions.push(Disposable.from(...extCommands));
}

const fullRegister = (context) => {
  // Init the statusbar if filters have been setup
  statusbar.create();

  const extCommands = [
    commands.registerCommand("teamEssentials.debugStart", () => Debug.start()),
    commands.registerCommand("teamEssentials.debugStop", () => Debug.stop()),
    commands.registerCommand("teamEssentials.filterExplorer", () => cmd.filterExplorer()),
    commands.registerCommand("teamEssentials.applyTeamSettings", () => cmd.applyTeamSettings()),
    commands.registerCommand("teamEssentials.updateExtensions", () => cmd.updateExtensions()),
    commands.registerCommand('teamEssentials.configWizard', () => cmd.getWizard())
  ];

  if (env.isWindows()) {
    extCommands.push(commands.registerCommand("teamEssentials.selectShell", () => cmd.selectShell()));
  }

  // Register Commands
  context.subscriptions.push(...extCommands);

  // Init all workspaceFolders
  workspace.workspaceFolders.forEach(workspaceFolder => {
    folders.push(new Folder(workspaceFolder, isMultiRootWorkspace));
    out.info(`Folder('${workspaceFolder.name}'): initialized`);
  });

  // On Current Workspace Change
  context.subscriptions.push(
    workspace.onDidOpenTextDocument((e) => {
      // Ignore anything that isn't a file opening
      if (e.uri.scheme === 'file') {
        // Ensure that this is a new document (not opening the same document n-times)
        if (e.uri.fsPath !== currentOpenFile) {
          let workspaceFolderId = env.getWorkspaceFolderId(e.uri);
          folders[workspaceFolderId].updateStatusBar();
          currentOpenFile = e.uri.fsPath;
        }
      }
    })
  );

}

const cmd = {
  getWizard: async () => {
    // if inside an open project (single or multi-root)
    if (workspace.workspaceFolders.length > 0) {
      let migrationTargets: WorkspaceFolder[] = new Array();
      workspace.workspaceFolders.forEach(workspaceFolder => {
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
    let resource = window.activeTextEditor.document.uri;
    if (resource) {
      folders[env.getWorkspaceFolderId(resource)].filterExplorer();
    } else {
      controls.ShowMessage(MessageType.Error, 'Please open a document before filtering that workspace.');
    }
  },
  applyTeamSettings: () => {
    let resource = window.activeTextEditor.document.uri;
    if (resource) {
      folders[env.getWorkspaceFolderId(resource)].applyTeamSettings();
    } else {
      controls.ShowMessage(MessageType.Error, 'Please open a document before applying Team Settings to a workspace.');
    }
  },
  updateExtensions: () => {
    let resource = window.activeTextEditor.document.uri;
    if (resource) {
      let folder = folders[env.getWorkspaceFolderId(resource)];
      if (folder) {
        folder.updateExtensions();
      }
    }
  },
  selectShell: () => {
    let resource = window.activeTextEditor.document.uri;
    if (resource) {
      folders[env.getWorkspaceFolderId(resource)].selectShell();
    } else {
      controls.ShowMessage(MessageType.Error, 'Please open a document before selecting a shell.');
    }
  }
}

// Team Essentials entry point
export const activate = (context: ExtensionContext) => {
  // Initialize the output channel
  out.setChannel(window.createOutputChannel("Team Essentials"));
  out.setLogLevel(API.Enums.LogLevel.info);
  out.info('Team Essentials starting.');

  let currentlyInstalledVersion = config.getGlobal('currentVersion');
  let disableWelcome = config.getGlobal('disableWelcome');
  disableWelcome = disableWelcome === undefined ? false : disableWelcome;

  if (!disableWelcome && currentlyInstalledVersion !== version) {
    config.setGlobal('currentVersion', version);

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