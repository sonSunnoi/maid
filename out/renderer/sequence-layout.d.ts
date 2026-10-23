import type { SequenceModel, Block } from './sequence-types.js';
export interface LayoutParticipant {
    id: string;
    display: string;
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface LayoutMessage {
    from: string;
    to: string;
    text?: string;
    y: number;
    x1: number;
    x2: number;
    line: 'solid' | 'dotted' | 'thick';
    startMarker: 'none' | 'arrow' | 'open' | 'cross';
    endMarker: 'none' | 'arrow' | 'open' | 'cross';
    async?: boolean;
}
export interface LayoutNote {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    anchor: 'left' | 'right' | 'over';
}
export interface LayoutBlock {
    type: Block['type'];
    title?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    branches?: Array<{
        title?: string;
        y: number;
    }>;
}
export interface LayoutActivation {
    actor: string;
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface SequenceLayout {
    width: number;
    height: number;
    participants: LayoutParticipant[];
    lifelines: Array<{
        x: number;
        y1: number;
        y2: number;
    }>;
    messages: LayoutMessage[];
    notes: LayoutNote[];
    blocks: LayoutBlock[];
    activations: LayoutActivation[];
}
export declare function layoutSequence(model: SequenceModel): SequenceLayout;
//# sourceMappingURL=sequence-layout.d.ts.map