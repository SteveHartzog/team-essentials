import { Position, Range, TextEdit, WorkspaceEdit } from 'vscode';

export function titleCase(source: string): string {
  return source.charAt(0).toUpperCase() + source.substr(1, source.length - 1).toLowerCase();
}