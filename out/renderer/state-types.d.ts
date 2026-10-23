import type { Direction } from './types.js';
export type StateKind = 'simple' | 'composite' | 'start' | 'end' | 'history' | 'history-deep' | 'choice' | 'fork' | 'join';
export interface StateNodeDef {
    id: string;
    label?: string;
    kind: StateKind;
    parent?: string;
}
export interface TransitionDef {
    source: string;
    target: string;
    label?: string;
}
export interface StateModel {
    direction: Direction;
    nodes: StateNodeDef[];
    transitions: TransitionDef[];
    composites: Array<{
        id: string;
        label?: string;
        nodes: string[];
        parent?: string;
    }>;
    lanes?: Array<{
        parentId: string;
        id: string;
        nodes: string[];
    }>;
}
//# sourceMappingURL=state-types.d.ts.map