export type { ValidationError, DiagramType, ValidateOptions, FixLevel, } from './core/types.js';
export { validate, detectDiagramType } from './core/router.js';
export { computeFixes } from './core/fixes.js';
export { applyEdits } from './core/edits.js';
export { MermaidRenderer, renderMermaid } from './renderer/index.js';
export type { RenderOptions, RenderResult } from './renderer/index.js';
export type { Graph, Node, Edge, NodeShape, ArrowType, Direction } from './renderer/types.js';
export { createMermaidAPI } from './mermaid-compat.js';
export type { MermaidAPI } from './mermaid-compat.js';
import type { FixLevel, ValidateOptions as Opts, ValidationError } from './core/types.js';
/**
 * Browser-friendly validation and auto-fix in one call
 */
export declare function fixText(text: string, options?: Opts & {
    level?: FixLevel;
}): {
    fixed: string;
    errors: ValidationError[];
};
//# sourceMappingURL=browser.d.ts.map