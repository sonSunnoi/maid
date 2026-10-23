// Core validators and helpers
export { validate, detectDiagramType } from './core/router.js';
export { validateFlowchart } from './diagrams/flowchart/validate.js';
export { validatePie } from './diagrams/pie/validate.js';
export { validateSequence } from './diagrams/sequence/validate.js';
export { validateClass } from './diagrams/class/validate.js';
export { validateState } from './diagrams/state/validate.js';
export { extractMermaidBlocks, offsetErrors } from './core/markdown.js';
// Formatting and edits
export { textReport, toJsonResult } from './core/format.js';
export { applyEdits, posToOffset, lineTextAt, inferIndentFromLine } from './core/edits.js';
// Auto-fixes
export { computeFixes } from './core/fixes.js';
// Renderer - NEW!
export { MermaidRenderer, renderMermaid } from './renderer/index.js';
// Mermaid.js-compatible API (drop-in replacement)
export { createMermaidAPI } from './mermaid-compat.js';
// Convenience: multi-pass fix for a single diagram string
export { fixText } from './core/fixText.js';
// Repair candidates for a gate that parses each candidate itself
export { repairCandidates } from './core/candidates.js';
//# sourceMappingURL=index.js.map