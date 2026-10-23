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
import { validate as _validate } from './core/router.js';
import { computeFixes as _computeFixes } from './core/fixes.js';
import { applyEdits as _applyEdits } from './core/edits.js';
/**
 * Run validation and repeatedly apply computed fixes until stable (max 5 passes).
 * Returns the final fixed text and the remaining diagnostics after fixes.
 */
export function fixText(text, options = {}) {
    const { strict = false, level = 'safe' } = options;
    let current = text;
    for (let i = 0; i < 5; i++) {
        const res = _validate(current, { strict });
        const edits = _computeFixes(current, res.errors, level);
        if (edits.length === 0)
            return { fixed: current, errors: res.errors };
        const next = _applyEdits(current, edits);
        if (next === current)
            return { fixed: current, errors: res.errors };
        current = next;
    }
    const finalRes = _validate(current, { strict });
    return { fixed: current, errors: finalRes.errors };
}
//# sourceMappingURL=index.js.map