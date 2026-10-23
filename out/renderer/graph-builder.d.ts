import type { CstNode } from 'chevrotain';
import type { Graph } from './types.js';
/**
 * Transforms a Chevrotain CST into a graph model suitable for rendering
 */
export declare class GraphBuilder {
    private nodes;
    private edges;
    private nodeCounter;
    private edgeCounter;
    private subgraphs;
    private currentSubgraphStack;
    private pendingLinkStyles;
    private classStyles;
    private nodeStyles;
    private nodeClasses;
    private edgeClasses;
    private edgeStyles;
    private nodeLinks;
    build(cst: CstNode | undefined): Graph;
    private reset;
    private extractDirection;
    private processStatements;
    private unquote;
    private processClick;
    private processNodeStatement;
    private processNodeGroup;
    private extractNodeInfo;
    private parseTypedAttrObject;
    private extractShapeAndLabel;
    private extractTextContent;
    private extractLinkInfo;
    private processSubgraph;
    private processClassDef;
    private processClassAssign;
    private processStyle;
    private collectStyleProps;
    private processEdgeAttr;
    private computeEdgeStyle;
    private processLinkStyle;
    private applyLinkStyles;
    private computeNodeStyle;
    private normalizeStyle;
}
//# sourceMappingURL=graph-builder.d.ts.map