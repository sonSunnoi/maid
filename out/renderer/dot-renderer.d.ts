import type { Layout } from './types.js';
import type { IRenderer } from './interfaces.js';
/**
 * Example renderer that generates Graphviz DOT format
 * Demonstrates the pluggability of the renderer architecture
 */
export declare class DotRenderer implements IRenderer {
    render(layout: Layout): string;
    private mapShape;
    private mapEdgeStyle;
    private escapeLabel;
}
//# sourceMappingURL=dot-renderer.d.ts.map