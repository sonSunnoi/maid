export type { ValidationError, DiagramType, ValidateOptions, PositionLC, TextEditLC, FixLevel, } from './core/types.js';
export { validate, detectDiagramType } from './core/router.js';
export { validateFlowchart } from './diagrams/flowchart/validate.js';
export { validatePie } from './diagrams/pie/validate.js';
export { validateSequence } from './diagrams/sequence/validate.js';
export { validateClass } from './diagrams/class/validate.js';
export { validateState } from './diagrams/state/validate.js';
export type { MermaidBlock } from './core/markdown.js';
export { extractMermaidBlocks, offsetErrors } from './core/markdown.js';
export { textReport, toJsonResult } from './core/format.js';
export { applyEdits, posToOffset, lineTextAt, inferIndentFromLine } from './core/edits.js';
export { computeFixes } from './core/fixes.js';
export { MermaidRenderer, renderMermaid } from './renderer/index.js';
export type { RenderOptions, RenderResult } from './renderer/index.js';
export type { Graph, Node, Edge, NodeShape, ArrowType, Direction } from './renderer/types.js';
export { createMermaidAPI } from './mermaid-compat.js';
import type { FixLevel, ValidateOptions as Opts, ValidationError } from './core/types.js';
/**
 * Run validation and repeatedly apply computed fixes until stable (max 5 passes).
 * Returns the final fixed text and the remaining diagnostics after fixes.
 */
export declare function fixText(text: string, options?: Opts & {
    level?: FixLevel;
}): {
    fixed: string;
    errors: ValidationError[];
};
//# sourceMappingURL=index.d.ts.map