export type ArrowMarker = 'none' | 'arrow' | 'open' | 'cross';
export type MessageLine = 'solid' | 'dotted' | 'thick';
export interface Participant {
    id: string;
    display: string;
}
export interface Message {
    from: string;
    to: string;
    text?: string;
    line: MessageLine;
    startMarker: ArrowMarker;
    endMarker: ArrowMarker;
    async?: boolean;
    activateTarget?: boolean;
    deactivateTarget?: boolean;
}
export type NotePos = 'leftOf' | 'rightOf' | 'over';
export interface Note {
    pos: NotePos;
    actors: string[];
    text: string;
}
export type BlockType = 'alt' | 'opt' | 'loop' | 'par' | 'critical' | 'break' | 'rect' | 'box';
export interface BlockBranch {
    kind: 'else' | 'and' | 'option';
    title?: string;
    startIndex?: number;
    endIndex?: number;
}
export interface Block {
    type: BlockType;
    title?: string;
    branches?: BlockBranch[];
    startIndex?: number;
    endIndex?: number;
}
export interface Activation {
    actor: string;
    startIndex: number;
    endIndex?: number;
}
export interface AutonumberConfig {
    on: boolean;
    start?: number;
    step?: number;
}
export type SequenceEvent = {
    kind: 'message';
    msg: Message;
} | {
    kind: 'note';
    note: Note;
} | {
    kind: 'activate';
    actor: string;
} | {
    kind: 'deactivate';
    actor: string;
} | {
    kind: 'block-start';
    block: Block;
} | {
    kind: 'block-branch';
    block: Block;
    branch: BlockBranch;
} | {
    kind: 'block-end';
    block: Block;
} | {
    kind: 'create';
    actor: string;
    display?: string;
} | {
    kind: 'destroy';
    actor: string;
} | {
    kind: 'noop';
};
export interface SequenceModel {
    participants: Participant[];
    events: SequenceEvent[];
    autonumber: AutonumberConfig;
    /** Optional diagram title ("title ...") */
    title?: string;
    /** Optional accessibility title ("accTitle ...") */
    accTitle?: string;
    /** Optional accessibility description ("accDescr ...") */
    accDescr?: string;
}
//# sourceMappingURL=sequence-types.d.ts.map