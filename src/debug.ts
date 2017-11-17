import { clone } from 'lodash';
import { commands, window, workspace, OutputChannel } from 'vscode';
import * as Utils from './api';

export class Debug {
  static async start() {
    const config = Utils.Configuration;
    const teamEssentials = config.loadTeamEssentials();
    const debugStart = teamEssentials['debug']['start'];
    // Debug Start: switch to custom view (output)
    commands.executeCommand(debugStart.output);

    // Debug Start: switch to custom view (explorer)
    commands.executeCommand(debugStart.explorer);
  }

  static async stop() {
    const config = Utils.Configuration;
    const output = Utils.UI.Output;

    const teamEssentials = config.loadTeamEssentials();
    const debugStop = teamEssentials['debug']['stop'];

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
