export interface NodeStyle {
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    fill?: string;
}
export interface Node {
    id: string;
    label: string;
    shape: NodeShape;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    style?: NodeStyle;
    link?: {
        href?: string;
        target?: string;
        tooltip?: string;
        call?: string;
    };
    typed?: {
        padding?: number;
        cornerRadius?: number;
        lean?: 'l' | 'r';
        media?: {
            icon?: string;
            image?: string;
        };
    };
}
export interface Edge {
    id: string;
    source: string;
    target: string;
    label?: string;
    type: ArrowType;
    markerStart?: 'none' | 'arrow' | 'circle' | 'cross';
    markerEnd?: 'none' | 'arrow' | 'circle' | 'cross';
    style?: NodeStyle;
    dasharray?: string;
    animation?: string;
}
export interface Graph {
    nodes: Node[];
    edges: Edge[];
    direction: Direction;
    subgraphs?: Subgraph[];
}
export interface Subgraph {
    id: string;
    label?: string;
    nodes: string[];
    parent?: string;
}
export type NodeShape = 'rectangle' | 'round' | 'stadium' | 'cylinder' | 'circle' | 'diamond' | 'hexagon' | 'parallelogram' | 'trapezoid' | 'trapezoidAlt' | 'double' | 'subroutine';
export type ArrowType = 'arrow' | 'open' | 'dotted' | 'thick' | 'invisible';
export type Direction = 'TB' | 'TD' | 'BT' | 'RL' | 'LR';
export interface LayoutNode extends Node {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface LayoutEdge extends Edge {
    points: Array<{
        x: number;
        y: number;
    }>;
    pathMode?: 'orthogonal' | 'smooth';
}
export interface LayoutSubgraph {
    id: string;
    label?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    parent?: string;
}
export interface Layout {
    nodes: LayoutNode[];
    edges: LayoutEdge[];
    width: number;
    height: number;
    subgraphs?: LayoutSubgraph[];
}
//# sourceMappingURL=types.d.ts.map