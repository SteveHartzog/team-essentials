import { OutputChannel, commands, workspace as workspace, window } from 'vscode';
// import { configTypes, config, env, ui } from '../util';
import * as Utils from './api';
import { clone } from 'lodash';

export default class Debug {
  static async start() {
    let config = Utils.Configuration;

    let teamEssentials = config.loadTeamEssentials();
    let debugStart = teamEssentials['debug']['start']
    // Debug Start: switch to custom view (output)
    commands.executeCommand(debugStart.output);

    // Debug Start: switch to custom view (explorer)
    commands.executeCommand(debugStart.explorer);
  }

  static async stop() {
    let config = Utils.Configuration;
    let output = Utils.UI.Output;

    let teamEssentials = config.loadTeamEssentials();
    let debugStop = teamEssentials['debug']['stop']

    // Stop server debugger
    await commands.executeCommand('workbench.action.debug.stop');

    // if terminatePreLaunchTask (default)
    if (debugStop.terminatePreLaunchTask) {
      await commands.executeCommand('workbench.action.tasks.terminate');
    }

    // Switch output
    if (debugStop.output.toLowerCase() === 'teamessentials') {
      // Debug Stop: keep TeamEssentials shown in output
      output.show();
    } else {
      // Debug Stop: switch to custom view (output)
      commands.executeCommand(debugStop.output);
    }

    // Debug Stop: switch to custom view (explorer)
    commands.executeCommand(debugStop.explorer);
  }
}
