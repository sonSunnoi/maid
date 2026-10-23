import type { Graph } from './types.js';
import type { ValidationError } from '../core/types.js';
import type { ILayoutEngine, IRenderer } from './interfaces.js';
export interface RenderOptions {
    /** Include validation errors as overlays on the diagram */
    showErrors?: boolean;
    /** Custom width for the SVG */
    width?: number;
    /** Custom height for the SVG */
    height?: number;
    /** Custom layout engine (defaults to DagreLayoutEngine) */
    layoutEngine?: ILayoutEngine;
    /** Custom renderer (defaults to SVGRenderer) */
    renderer?: IRenderer;
}
export interface RenderResult {
    svg: string;
    graph: Graph;
    errors: ValidationError[];
}
/**
 * Main renderer class that orchestrates the rendering pipeline
 */
export declare class MermaidRenderer {
    private graphBuilder;
    private layoutEngine;
    private renderer;
    constructor(layoutEngine?: ILayoutEngine, renderer?: IRenderer);
    /**
     * Renders a Mermaid flowchart diagram
     */
    render(text: string, options?: RenderOptions): RenderResult;
    /**
     * Renders supported diagram types (flowchart + pie for now)
     */
    renderAny(text: string, options?: RenderOptions): RenderResult;
    private addErrorOverlays;
    private generateErrorSvg;
    private wrapText;
    private escapeXml;
}
export declare function renderMermaid(text: string, options?: RenderOptions): RenderResult;
export type { ILayoutEngine, IRenderer } from './interfaces.js';
export type { Graph, Layout, Node, Edge, LayoutNode, LayoutEdge } from './types.js';
export { DagreLayoutEngine } from './layout.js';
export { SVGRenderer } from './svg-generator.js';
export { DotRenderer } from './dot-renderer.js';
//# sourceMappingURL=index.d.ts.map