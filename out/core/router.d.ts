import { ValidationError, DiagramType, ValidateOptions } from './types.js';
export declare function detectDiagramType(text: string): DiagramType;
export declare function validate(text: string, options?: ValidateOptions): {
    type: DiagramType;
    errors: ValidationError[];
};
//# sourceMappingURL=router.d.ts.map