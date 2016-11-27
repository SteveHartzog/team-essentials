import * as fs from 'fs';
import * as json5 from 'comment-json';

export default class json {
  public static getConfig(filePath: string, defaultOutput?: {}): JSON {
    let data;
    try {
      data = fs.readFileSync(filePath, "utf8");
    } catch (error) {
      if (error instanceof Error && error['code'] === 'ENOENT') {
        // file not found create file
        fs.writeFile(filePath, json5.stringify({}, null, 2), function (err) {
          if (err) {
            console.error(err);
          }
        });
      }
    } finally {
      if (data.length === 0) {
        return json5.parse(defaultOutput);
      } else {
        return json5.parse(data, null, true);
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