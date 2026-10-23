import { CstParser, type IToken } from 'chevrotain';
export declare class StateParser extends CstParser {
    constructor();
    diagram: import("chevrotain").ParserMethod<[], import("chevrotain").CstNode>;
    private statement;
    private styleStmt;
    private directionStmt;
    private actorRef;
    private labelText;
    private transitionStmt;
    private stateDecl;
    private stateBlock;
    private innerStatement;
    private noteStmt;
    private stateDescriptionStmt;
}
export declare const parserInstance: StateParser;
export declare function parse(tokens: IToken[]): {
    cst: import("chevrotain").CstNode;
    errors: import("chevrotain").IRecognitionException[];
};
//# sourceMappingURL=parser.d.ts.map