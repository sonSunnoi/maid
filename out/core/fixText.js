import { validate as _validate } from './router.js';
import { computeFixes as _computeFixes } from './fixes.js';
import { applyEdits as _applyEdits } from './edits.js';
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
//# sourceMappingURL=fixText.js.map