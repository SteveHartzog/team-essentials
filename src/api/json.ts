import { writeFileSync } from 'fs';
import * as jsonc from 'jsonc-parser';
import * as io from './io';
import * as UI from './ui';

export function getConfig(filePath: string): JSON {
  UI.Output.log(`getConfig('${filePath}')`);
  try {
    const data = io.getFile(filePath);
    if (data.length === 0) {
      return JSON.parse('{}');
    } else {
      return jsonc.parse(data, null, { disallowComments: true });
    }
  } catch (error) {
    if (error instanceof Error && error['code'] === 'ENOENT') {
      // file not found create empty json
      io.saveFile(filePath, '{}');
      return JSON.parse('{}');
    }
  }
}

export function stringify(data): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Writes a json file to disk.
 *
 * @static
 * @param {string} filePath The full OS path of the file to save
 * @param {string} data The JSON object to save
 */
export function write(filePath: string, data: string) {
  writeFileSync(filePath, data);
}