import type { ILexingError, IRecognitionException } from 'chevrotain';
import type { ValidationError } from './types.js';
export declare function coercePos(line?: number | null, column?: number | null, fallbackLine?: number, fallbackColumn?: number): {
    line: number;
    column: number;
};
export declare function endOfTextPos(text: string): {
    line: number;
    column: number;
};
export declare function codeFrame(text: string, line: number, column: number, length?: number, contextLines?: number): string;
export declare function fromLexerError(e: ILexingError): ValidationError;
export declare function mapFlowchartParserError(err: IRecognitionException, text: string): ValidationError;
export declare function mapPieParserError(err: IRecognitionException, text: string): ValidationError;
export declare function mapSequenceParserError(err: IRecognitionException, text: string): ValidationError;
export declare function mapClassParserError(err: IRecognitionException, text: string): ValidationError;
export declare function mapStateParserError(err: IRecognitionException, text: string): ValidationError;
//# sourceMappingURL=diagnostics.d.ts.map