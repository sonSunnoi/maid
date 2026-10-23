export interface ValidationError {
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning';
    code?: string;
    hint?: string;
    length?: number;
}
export type DiagramType = 'flowchart' | 'pie' | 'sequence' | 'class' | 'state' | 'unknown';
export interface ValidateOptions {
    strict?: boolean;
}
export interface PositionLC {
    line: number;
    column: number;
}
export interface TextEditLC {
    start: PositionLC;
    end?: PositionLC;
    newText: string;
}
export type FixLevel = 'safe' | 'all';
//# sourceMappingURL=types.d.ts.map