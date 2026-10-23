import type { Graph, Layout } from './types.js';
import type { ILayoutEngine } from './interfaces.js';
/**
 * Calculates node and edge positions using dagre layout algorithm
 */
export declare class DagreLayoutEngine implements ILayoutEngine {
    private nodeWidth;
    private nodeHeight;
    private rankSep;
    private nodeSep;
    private edgeSep;
    layout(graph: Graph): Layout;
    private mapDirection;
    private calculateNodeDimensions;
    private clusterAnchor;
    private nodeAnchor;
}
//# sourceMappingURL=layout.d.ts.map