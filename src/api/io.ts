import { readFileSync, writeFileSync, createReadStream } from 'fs';
import * as rd from 'readline'

export default class IO {
  public static getFile(filePath: string) {
    let data = readFileSync(filePath, 'utf8');
    return (data.length > 0) ? data : null;
  }

  public static getFileLineArray(filePath: string) {
    let array = this.getFile(filePath).split('\n');
    let lineArray = [];
    for (let line of array) {
      line = line.trim();
      // if (!line.startsWith('#') && line.length !== 0) {
      lineArray.push(line);
      // }
    }
    return lineArray;
  }

  public static async readFile(filePath: string) {
    var reader = rd.createInterface(createReadStream(filePath))

    // var data: Array<{ number: number; from: string; to: string }> = [];
    let data: string[] = new Array();
    await reader.on('line', (l: string) => {
      // var tokens = l.split(' ');
      // var nr = parseInt(tokens[0]);
      // var from = tokens[1];
      // var to = tokens[2]
      // console.log(`nr: ${nr} from ${from} to ${to}`);
      // data.push({ number: nr, from, to });
      if (!l.startsWith('#') || l.length !== 0) {
        data.push(l);
      }
    }).on('close', () => {
      // console.log(`Data has been read ${data.length}`);
      // data.forEach(element => {
      //   // console.log(`nr: ${element.number} from ${element.from} to ${element.to}`)
      // });
      return data;
    });
  }

  public static saveFile(filePath: string, data) {
    writeFileSync(filePath, data);
  }
}