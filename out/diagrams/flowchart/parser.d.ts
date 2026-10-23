import { CstParser, type IToken } from 'chevrotain';
export declare class MermaidParser extends CstParser {
    constructor();
    diagram: import("chevrotain").ParserMethod<[], import("chevrotain").CstNode>;
    private statement;
    private nodeStatement;
    private nodeOrParallelGroup;
    private node;
    private attrObject;
    private attrPair;
    private attrShapeValue;
    private clickStatement;
    private clickHref;
    private clickCall;
    private linkStyleStatement;
    private linkStyleIndexList;
    private linkStylePairs;
    private linkStylePair;
    private linkStyleValueChunk;
    private nodeShape;
    private nodeContent;
    private link;
    private linkText;
    private linkTextInline;
    private inlineTextRun;
    private linkInlineTail;
    private subgraph;
    private subgraphStatement;
    private directionStatement;
    private classStatement;
    private styleStatement;
    private classDefStatement;
    private _augmentNodeRule;
}
export declare const parserInstance: MermaidParser;
export declare function parse(tokensArr: IToken[]): {
    cst: import("chevrotain").CstNode;
    errors: import("chevrotain").IRecognitionException[];
};
//# sourceMappingURL=parser.d.ts.map