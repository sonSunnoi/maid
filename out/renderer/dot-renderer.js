/**
 * Example renderer that generates Graphviz DOT format
 * Demonstrates the pluggability of the renderer architecture
 */
export class DotRenderer {
    render(layout) {
        const lines = [];
        lines.push('digraph mermaid {');
        lines.push('  rankdir=TB;');
        lines.push('  node [shape=box, style=filled, fillcolor="#f9f9ff"];');
        lines.push('');
        // Add nodes
        for (const node of layout.nodes) {
            const shape = this.mapShape(node.shape);
            const label = this.escapeLabel(node.label);
            lines.push(`  "${node.id}" [label="${label}", shape=${shape}];`);
        }
        lines.push('');
        // Add edges
        for (const edge of layout.edges) {
            const style = this.mapEdgeStyle(edge.type);
            const label = edge.label ? `, label="${this.escapeLabel(edge.label)}"` : '';
            lines.push(`  "${edge.source}" -> "${edge.target}" [${style}${label}];`);
        }
        lines.push('}');
        return lines.join('\n');
    }
    mapShape(shape) {
        switch (shape) {
            case 'rectangle': return 'box';
            case 'round': return 'box, style="rounded,filled"';
            case 'circle': return 'circle';
            case 'diamond': return 'diamond';
            case 'hexagon': return 'hexagon';
            case 'parallelogram': return 'box, skew=0.3';
            case 'trapezoid': return 'trapezium';
            case 'cylinder': return 'cylinder';
            default: return 'box';
        }
    }
    mapEdgeStyle(type) {
        switch (type) {
            case 'dotted': return 'style=dotted';
            case 'thick': return 'penwidth=3';
            case 'open': return 'arrowhead=none';
            default: return 'style=solid';
        }
    }
    escapeLabel(text) {
        return text.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    }
}
//# sourceMappingURL=dot-renderer.js.map