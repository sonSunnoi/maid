import type { PieChartModel } from './pie-types.js';
export interface PieBuildResult {
    model: PieChartModel;
    errors: Array<{
        line: number;
        column: number;
        message: string;
        code: string;
        severity: 'error' | 'warning';
    }>;
}
export declare function buildPieModel(text: string): PieBuildResult;
//# sourceMappingURL=pie-builder.d.ts.map