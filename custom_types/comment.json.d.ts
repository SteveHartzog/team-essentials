declare module 'comment-json' {
  export function parse(stringToParse: any, reviver?, removeComments?: boolean): JSON
  export function stringify(object: {}, replacer?: any, space?: any): string;
}