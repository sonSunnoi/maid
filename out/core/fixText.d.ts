import type { FixLevel, ValidateOptions as Opts, ValidationError } from './types.js';
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
//# sourceMappingURL=fixText.d.ts.map