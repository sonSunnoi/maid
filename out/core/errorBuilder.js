import { coercePos } from './diagnostics.js';
export function errorAt(line, column, message, extra = {}) {
    const pos = coercePos(line ?? null, column ?? null, 1, 1);
    return { line: pos.line, column: pos.column, message, severity: 'error', ...extra };
}
export function errorAtToken(tok, message, extra = {}) {
    return errorAt(tok?.startLine, tok?.startColumn, message, extra);
}
export function warningAt(line, column, message, extra = {}) {
    const pos = coercePos(line ?? null, column ?? null, 1, 1);
    return { line: pos.line, column: pos.column, message, severity: 'warning', ...extra };
}
//# sourceMappingURL=errorBuilder.js.map