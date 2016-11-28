import * as fs from 'fs';
import * as json5 from 'comment-json';

export default class json {
  public static getConfig(filePath: string, defaultJson?: JSON): JSON {
    try {
      let data = fs.readFileSync(filePath, "utf8");
      if (data.length === 0) {
        return json5.parse(defaultJson);
      } else {
        return json5.parse(data, null, true);
      }
    } catch (error) {
      if (error instanceof Error && error['code'] === 'ENOENT') {
        // file not found create file
        fs.writeFile(filePath, json5.stringify(defaultJson, null, 2), function (err) {
          if (err) {
            console.error(err);
          }
        });
        return defaultJson;
      }
    }
  }

  public static stringify(data): string {
    return json5.stringify(data, null, 2);
  }

  public static writeFile(filePath: string, content: string) {
    fs.writeFile(filePath, content, function (err) {
      if (err) {
        console.error(err);
      }
    });

  }
}