import { CstParser, type IToken } from 'chevrotain';
export declare class ClassParser extends CstParser {
    constructor();
    diagram: import("chevrotain").ParserMethod<[], import("chevrotain").CstNode>;
    private statement;
    private directionStmt;
    private titleStmt;
    private namespaceStmt;
    private classLine;
    private interfaceLine;
    private memberAssignStmt;
    private memberLineStmt;
    private memberLine;
    private memberName;
    private param;
    private argList;
    private typeRef;
    private noteStmt;
    private styleStatement;
    private classDefStatement;
    private cssClassStatement;
    private relationOp;
    private classRef;
    private labelText;
    private relationStmt;
}
export declare const parserInstance: ClassParser;
export declare function parse(tokens: IToken[]): {
    cst: import("chevrotain").CstNode;
    errors: import("chevrotain").IRecognitionException[];
};
//# sourceMappingURL=parser.d.ts.map