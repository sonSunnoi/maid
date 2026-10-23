import { CstParser, type IToken } from 'chevrotain';
export declare class PieParser extends CstParser {
    constructor();
    diagram: import("chevrotain").ParserMethod<[], import("chevrotain").CstNode>;
    private statement;
    private titleStmt;
    private sliceStmt;
    private sliceLabel;
}
export declare const parserInstance: PieParser;
export declare function parse(tokens: IToken[]): {
    cst: import("chevrotain").CstNode;
    errors: import("chevrotain").IRecognitionException[];
};
//# sourceMappingURL=parser.d.ts.map