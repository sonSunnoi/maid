import type { IToken } from 'chevrotain';
import type { ValidationError } from './types.js';
export declare function detectEscapedQuotes(tokens: IToken[], opts: {
    code: string;
    message?: string;
    hint?: string;
}): ValidationError[];
export declare function detectDoubleInDouble(tokens: IToken[], opts: {
    code: string;
    message: string;
    hint: string;
    scopeEndTokenNames?: string[];
    scopeStartTokenNames?: string[];
}): ValidationError[];
export declare function detectUnclosedQuotesInText(text: string, opts: {
    code: string;
    message?: string;
    hint?: string;
    limitPerFile?: number;
}): ValidationError[];
//# sourceMappingURL=quoteHygiene.d.ts.map