import { createReadStream, readFileSync, writeFileSync } from 'fs';
import { isEmpty } from 'lodash';
import * as rd from 'readline';

export function getFile(filePath: string) {
  const data = readFileSync(filePath, 'utf8');
  return (data.length > 0) ? data : null;
}

export function getFileLineArray(filePath: string) {
  const array = this.getFile(filePath).split('\n');
  const lineArray = [];
  for (let line of array) {
    line = line.trim();
    lineArray.push(line);
  }
  return lineArray;
}

export async function readFile(filePath: string) {
  const reader = rd.createInterface(createReadStream(filePath));

  const data: string[] = new Array();
  await reader.on('line', (l: string) => {
    if (!l.startsWith('#') || l.length !== 0) {
      data.push(l);
    }
  }).on('close', () => {
    return data;
  });
}

export function saveFile(filePath: string, data) {
  if (!isEmpty(data)) {
    writeFileSync(filePath, data);
  }
}