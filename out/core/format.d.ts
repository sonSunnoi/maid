import type { ValidationError } from './types.js';
export type OutputFormat = 'text' | 'json';
export declare function groupErrors(errors: ValidationError[]): {
    errs: ValidationError[];
    warns: ValidationError[];
};
export declare function textReport(filename: string, content: string, errors: ValidationError[]): string;
export declare function toJsonResult(filename: string, errors: ValidationError[]): {
    file: string;
    valid: boolean;
    errorCount: number;
    warningCount: number;
    errors: ValidationError[];
    warnings: ValidationError[];
};
//# sourceMappingURL=format.d.ts.map