import type { PositionLC, TextEditLC } from './types.js';
export declare function posToOffset(text: string, pos: PositionLC): number;
export declare function applyEdits(text: string, edits: TextEditLC[]): string;
export declare function replaceRange(text: string, start: PositionLC, length: number, newText: string): TextEditLC;
export declare function insertAt(text: string, start: PositionLC, newText: string): TextEditLC;
export declare function lineTextAt(text: string, line: number): string;
export declare function inferIndentFromLine(lineText: string): string;
//# sourceMappingURL=edits.d.ts.map