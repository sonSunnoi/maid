import type { IToken } from 'chevrotain';
import type { ValidationError } from './types.js';
type Common = {
    code?: string;
    hint?: string;
    length?: number;
};
export declare function errorAt(line: number | null | undefined, column: number | null | undefined, message: string, extra?: Common): ValidationError;
export declare function errorAtToken(tok: IToken | undefined | null, message: string, extra?: Common): ValidationError;
export declare function warningAt(line: number | null | undefined, column: number | null | undefined, message: string, extra?: Omit<Common, 'code'> & {
    code?: string;
}): ValidationError;
export {};
//# sourceMappingURL=errorBuilder.d.ts.map