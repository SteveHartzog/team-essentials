import { WorkspaceEdit, Position, Range, TextEdit } from 'vscode';

export default class Misc {
  public static titleCase(source: string): string {
    return source.charAt(0).toUpperCase() + source.substr(1, source.length - 1).toLowerCase()
  }
}