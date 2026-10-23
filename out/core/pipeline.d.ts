import type { ILexingError, IRecognitionException, IToken } from 'chevrotain';
import type { ValidationError } from './types.js';
export interface LintAdapters {
    tokenize: (text: string) => {
        tokens: IToken[];
        errors: ILexingError[];
    };
    parse: (tokens: IToken[]) => {
        cst: any;
        errors: IRecognitionException[];
    };
    analyze: (cst: any, tokens: IToken[]) => ValidationError[];
    mapParserError: (err: IRecognitionException, text: string) => ValidationError;
    postLex?: (text: string, tokens: IToken[]) => ValidationError[];
    postParse?: (text: string, tokens: IToken[], cst: any, prevErrors: ValidationError[]) => ValidationError[];
}
export declare function lintWithChevrotain(text: string, adapters: LintAdapters): ValidationError[];
//# sourceMappingURL=pipeline.d.ts.map