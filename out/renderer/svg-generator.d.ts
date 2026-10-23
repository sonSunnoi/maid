import type { Layout } from './types.js';
import type { IRenderer } from './interfaces.js';
/**
 * Generates SVG from a laid-out graph
 */
export declare class SVGRenderer implements IRenderer {
    private padding;
    private fontSize;
    private fontFamily;
    private defaultStroke;
    private defaultFill;
    private arrowStroke;
    private arrowMarkerSize;
    render(layout: Layout): string;
    private buildNodeStyleAttrs;
    private buildNodeStrokeStyle;
    private generateDefs;
    private generateNodeWithPad;
    private generateWrappedText;
    private generateRichText;
    private normalizeHtml;
    private htmlDecode;
    private generateEdge;
    private buildSmoothSegments;
    private pathFromSegments;
    private trimSegmentsEnd;
    private trimSegmentsStart;
    private intersectSegmentsEnd;
    private intersectSegmentsStart;
    private intersectLineWithNode;
    private lineCircleIntersection;
    private linePolygonIntersection;
    private nearestPointOnSegment;
    private nearestPointOnPolygon;
    private segmentIntersection;
    private pointAtRatio;
    private escapeXml;
}
//# sourceMappingURL=svg-generator.d.ts.map