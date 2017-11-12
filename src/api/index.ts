import * as config from './config';
import * as env from './environment';
import * as exe from './execute';
import * as io from './io';
import * as json from './json';
import * as ui from './ui';
import * as misc from './misc';
import * as wiz from './wizard';

// Has multiple classes without a default, but because we have an enum we need to split out export
export const UI = {
  Statusbar: ui.Statusbar,
  Output: ui.Output,
  Controls: ui.Controls,
  Choice: ui.Choice
}

// Extract and wrap enums
export const Enums = {
  ConfigurationFiles: config.ConfigurationFiles,
  LogLevel: ui.LogLevel,
  MessageType: ui.MessageType
};

// Has one default but two exports
export const Configuration = config.default;

// Normal export default
export const Environment = env;
export const Execution = exe;
export const IO = io;
export const JSON5 = json;
export const Miscellaneous = misc;
export const Wizard = wiz;