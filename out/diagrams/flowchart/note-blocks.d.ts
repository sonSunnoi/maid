export type FlowchartNoteBlock = {
    startLine: number;
    endLine: number;
    targetId: string;
    position: 'left' | 'right' | 'over';
    text: string;
    hasInlineBody: boolean;
};
export declare function findFlowchartNoteBlocks(text: string): FlowchartNoteBlock[];
//# sourceMappingURL=note-blocks.d.ts.map