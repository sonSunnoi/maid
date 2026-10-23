export type SharedStyleOptions = {
    fontFamily?: string;
    fontSize?: number;
    nodeFill?: string;
    nodeStroke?: string;
    edgeStroke?: string;
};
export declare function buildSharedCss(opts?: SharedStyleOptions): string;
export declare function applyFlowLikeTheme(svg: string, theme?: Record<string, any>): string;
//# sourceMappingURL=styles.d.ts.map