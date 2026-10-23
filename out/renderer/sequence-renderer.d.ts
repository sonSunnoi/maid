import type { SequenceModel } from './sequence-types.js';
export interface SequenceRenderOptions {
    width?: number;
    height?: number;
    theme?: Record<string, any>;
}
export declare function renderSequence(model: SequenceModel, opts?: SequenceRenderOptions): string;
//# sourceMappingURL=sequence-renderer.d.ts.map