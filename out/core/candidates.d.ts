import type { FixLevel } from './types.js';
export interface RepairCandidate {
    text: string;
    rule: string;
    issue: string;
    level: FixLevel;
}
/**
 * Ordered repair candidates for one diagram. Pure and synchronous; a candidate
 * is a guess, never a claim that Mermaid accepts it. The caller must parse it.
 */
export declare function repairCandidates(source: string, options?: {
    level?: FixLevel;
}): RepairCandidate[];
//# sourceMappingURL=candidates.d.ts.map