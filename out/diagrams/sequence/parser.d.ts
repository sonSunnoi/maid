import { CstParser, type IToken } from 'chevrotain';
export declare class SequenceParser extends CstParser {
    constructor();
    diagram: import("chevrotain").ParserMethod<[], import("chevrotain").CstNode>;
    private line;
    private metaStmt;
    private blankLine;
    private actorRef;
    private participantDecl;
    private autonumberStmt;
    private noteStmt;
    private activateStmt;
    private deactivateStmt;
    private createStmt;
    private destroyStmt;
    private linkStmt;
    private propertiesStmt;
    private detailsStmt;
    private messageStmt;
    private arrow;
    private altBlock;
    private optBlock;
    private loopBlock;
    private parBlock;
    private parHeader;
    private criticalBlock;
    private breakBlock;
    private rectBlock;
    private boxBlock;
    private lineRemainder;
}
export declare const parserInstance: SequenceParser;
export declare function parse(tokens: IToken[]): {
    cst: any;
    errors: import("chevrotain").IRecognitionException[];
};
//# sourceMappingURL=parser.d.ts.map