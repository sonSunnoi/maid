import type { ValidationError } from './types.js';
export interface MermaidBlock {
    content: string;
    startLine: number;
    endLine: number;
    info: string;
    fence: string;
}
export declare function extractMermaidBlocks(text: string): MermaidBlock[];
export declare function offsetErrors(errors: ValidationError[], lineOffset: number): ValidationError[];
//# sourceMappingURL=markdown.d.ts.map