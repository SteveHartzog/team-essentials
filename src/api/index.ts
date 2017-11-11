// Has multiple classes, no default
import * as ui from './ui';

// Has one default but two exports
import * as config from './config';

// Normal export default
import env from './environment';
import exe from './execute';
import io from './io';
import json from './json';
import misc from './misc';
import wiz from './wizard';

// Has multiple classes without a default, but because we have an enum we need to split out export
export const UI = {
  Statusbar: ui.Statusbar,
  Output: ui.Output,
  Controls: ui.Controls,
  MyItem: ui.MyItem
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