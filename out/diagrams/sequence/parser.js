import { CstParser, EOF } from 'chevrotain';
import * as t from './lexer.js';
// Free text (participant aliases, message bodies, note text, block titles) runs to the end of
// the line in Mermaid, so keyword and arrow tokens appearing there must not terminate it.
// Only the line terminator ends a text run.
const TEXT_TOKENS = t.allTokens.filter((tk) => tk !== t.Newline && tk !== t.Comment && tk !== t.WhiteSpace);
export class SequenceParser extends CstParser {
    constructor() {
        super(t.allTokens);
        this.diagram = this.RULE('diagram', () => {
            this.CONSUME(t.SequenceKeyword);
            this.MANY(() => this.CONSUME(t.Newline));
            this.MANY2(() => {
                this.SUBRULE(this.line);
            });
            this.OPTION(() => this.CONSUME(EOF));
        });
        this.line = this.RULE('line', () => {
            this.OR([
                { ALT: () => this.SUBRULE(this.metaStmt) },
                { ALT: () => this.SUBRULE(this.participantDecl) },
                { ALT: () => this.SUBRULE(this.autonumberStmt) },
                { ALT: () => this.SUBRULE(this.noteStmt) },
                { ALT: () => this.SUBRULE(this.activateStmt) },
                { ALT: () => this.SUBRULE(this.deactivateStmt) },
                { ALT: () => this.SUBRULE(this.createStmt) },
                { ALT: () => this.SUBRULE(this.destroyStmt) },
                { ALT: () => this.SUBRULE(this.linkStmt) },
                { ALT: () => this.SUBRULE(this.propertiesStmt) },
                { ALT: () => this.SUBRULE(this.detailsStmt) },
                { ALT: () => this.SUBRULE(this.altBlock) },
                { ALT: () => this.SUBRULE(this.optBlock) },
                { ALT: () => this.SUBRULE(this.loopBlock) },
                { ALT: () => this.SUBRULE(this.parBlock) },
                { ALT: () => this.SUBRULE(this.criticalBlock) },
                { ALT: () => this.SUBRULE(this.breakBlock) },
                { ALT: () => this.SUBRULE(this.rectBlock) },
                { ALT: () => this.SUBRULE(this.boxBlock) },
                { ALT: () => this.SUBRULE(this.messageStmt) },
                { ALT: () => this.SUBRULE(this.blankLine) },
            ]);
        });
        this.metaStmt = this.RULE('metaStmt', () => {
            this.OR([
                { ALT: () => this.CONSUME(t.TitleKeyword) },
                { ALT: () => this.CONSUME(t.AccTitleKeyword) },
                { ALT: () => this.CONSUME(t.AccDescrKeyword) },
            ]);
            this.OPTION(() => this.SUBRULE(this.lineRemainder));
            this.OR2([
                { ALT: () => this.AT_LEAST_ONE(() => this.CONSUME(t.Newline)) },
                { ALT: () => this.CONSUME(EOF) }
            ]);
        });
        this.blankLine = this.RULE('blankLine', () => {
            this.AT_LEAST_ONE(() => this.CONSUME(t.Newline));
        });
        this.actorRef = this.RULE('actorRef', () => {
            // Accept a sequence of tokens that form the actor name until 'as' or newline/arrow/punct
            this.AT_LEAST_ONE(() => this.OR([
                { ALT: () => this.CONSUME(t.Identifier) },
                { ALT: () => this.CONSUME(t.QuotedString) },
                { ALT: () => this.CONSUME(t.NumberLiteral) },
                { ALT: () => this.CONSUME(t.Text) },
            ]));
        });
        this.participantDecl = this.RULE('participantDecl', () => {
            this.OR([
                { ALT: () => this.CONSUME(t.ParticipantKeyword) },
                { ALT: () => this.CONSUME(t.ActorKeyword) },
            ]);
            this.SUBRULE(this.actorRef);
            this.OPTION(() => {
                this.CONSUME(t.AsKeyword);
                // Alias text is free text: keywords, punctuation and symbols are all valid there.
                this.OPTION2(() => this.SUBRULE(this.lineRemainder));
            });
            this.OR2([
                { ALT: () => this.AT_LEAST_ONE(() => this.CONSUME(t.Newline)) },
                { ALT: () => this.CONSUME(EOF) }
            ]);
        });
        this.autonumberStmt = this.RULE('autonumberStmt', () => {
            this.CONSUME(t.AutonumberKeyword);
            this.OPTION(() => {
                this.OR([
                    { ALT: () => this.CONSUME(t.OffKeyword) },
                    { ALT: () => {
                            this.CONSUME(t.NumberLiteral);
                            this.OPTION2(() => this.CONSUME2(t.NumberLiteral));
                        } },
                ]);
            });
            this.OR2([
                { ALT: () => this.AT_LEAST_ONE(() => this.CONSUME(t.Newline)) },
                { ALT: () => this.CONSUME(EOF) }
            ]);
        });
        this.noteStmt = this.RULE('noteStmt', () => {
            this.CONSUME(t.NoteKeyword);
            this.OR([
                { ALT: () => {
                        this.OR2([
                            { ALT: () => this.CONSUME(t.LeftKeyword) },
                            { ALT: () => this.CONSUME(t.RightKeyword) },
                        ]);
                        this.CONSUME(t.OfKeyword);
                        this.SUBRULE(this.actorRef);
                    } },
                { ALT: () => {
                        this.CONSUME(t.OverKeyword);
                        this.SUBRULE2(this.actorRef);
                        this.OPTION(() => {
                            this.CONSUME(t.Comma);
                            this.SUBRULE3(this.actorRef);
                        });
                    } }
            ]);
            this.CONSUME(t.Colon);
            this.OPTION2(() => this.SUBRULE(this.lineRemainder));
            this.OR3([
                { ALT: () => this.AT_LEAST_ONE(() => this.CONSUME(t.Newline)) },
                { ALT: () => this.CONSUME(EOF) }
            ]);
        });
        this.activateStmt = this.RULE('activateStmt', () => {
            this.CONSUME(t.ActivateKeyword);
            this.SUBRULE(this.actorRef);
            this.OR2([
                { ALT: () => this.AT_LEAST_ONE(() => this.CONSUME(t.Newline)) },
                { ALT: () => this.CONSUME(EOF) }
            ]);
        });
        this.deactivateStmt = this.RULE('deactivateStmt', () => {
            this.CONSUME(t.DeactivateKeyword);
            this.SUBRULE(this.actorRef);
            this.OR2([
                { ALT: () => this.AT_LEAST_ONE(() => this.CONSUME(t.Newline)) },
                { ALT: () => this.CONSUME(EOF) }
            ]);
        });
        this.createStmt = this.RULE('createStmt', () => {
            this.CONSUME(t.CreateKeyword);
            this.OR([
                { ALT: () => this.CONSUME(t.ParticipantKeyword) },
                { ALT: () => this.CONSUME(t.ActorKeyword) },
            ]);
            this.SUBRULE(this.actorRef);
            this.OPTION(() => {
                this.CONSUME(t.AsKeyword);
                this.OPTION2(() => this.SUBRULE(this.lineRemainder));
            });
            this.OR2([
                { ALT: () => this.AT_LEAST_ONE(() => this.CONSUME(t.Newline)) },
                { ALT: () => this.CONSUME(EOF) }
            ]);
        });
        this.destroyStmt = this.RULE('destroyStmt', () => {
            this.CONSUME(t.DestroyKeyword);
            this.OPTION(() => {
                this.OR([
                    { ALT: () => this.CONSUME(t.ParticipantKeyword) },
                    { ALT: () => this.CONSUME(t.ActorKeyword) },
                ]);
            });
            this.SUBRULE(this.actorRef);
            this.OR2([
                { ALT: () => this.AT_LEAST_ONE(() => this.CONSUME(t.Newline)) },
                { ALT: () => this.CONSUME(EOF) }
            ]);
        });
        this.linkStmt = this.RULE('linkStmt', () => {
            this.OR([
                { ALT: () => this.CONSUME(t.LinkKeyword) },
                { ALT: () => this.CONSUME(t.LinksKeyword) },
            ]);
            this.SUBRULE(this.actorRef);
            this.CONSUME(t.Colon);
            this.OPTION(() => this.SUBRULE(this.lineRemainder));
            this.OR2([
                { ALT: () => this.AT_LEAST_ONE(() => this.CONSUME(t.Newline)) },
                { ALT: () => this.CONSUME(EOF) }
            ]);
        });
        this.propertiesStmt = this.RULE('propertiesStmt', () => {
            this.CONSUME(t.PropertiesKeyword);
            this.OPTION(() => this.CONSUME(t.Colon));
            this.OPTION1(() => this.SUBRULE(this.lineRemainder));
            this.OR2([
                { ALT: () => this.AT_LEAST_ONE(() => this.CONSUME(t.Newline)) },
                { ALT: () => this.CONSUME(EOF) }
            ]);
        });
        this.detailsStmt = this.RULE('detailsStmt', () => {
            this.CONSUME(t.DetailsKeyword);
            this.OPTION(() => this.CONSUME(t.Colon));
            this.OPTION1(() => this.SUBRULE(this.lineRemainder));
            this.OR2([
                { ALT: () => this.AT_LEAST_ONE(() => this.CONSUME(t.Newline)) },
                { ALT: () => this.CONSUME(EOF) }
            ]);
        });
        this.messageStmt = this.RULE('messageStmt', () => {
            this.SUBRULE(this.actorRef);
            this.SUBRULE(this.arrow);
            this.OPTION(() => this.OR([
                { ALT: () => this.CONSUME(t.Plus) },
                { ALT: () => this.CONSUME(t.Minus) }
            ]));
            this.SUBRULE2(this.actorRef);
            this.CONSUME(t.Colon);
            this.OPTION2(() => this.SUBRULE(this.lineRemainder));
            this.OR2([
                { ALT: () => this.AT_LEAST_ONE(() => this.CONSUME(t.Newline)) },
                { ALT: () => this.CONSUME(EOF) }
            ]);
        });
        this.arrow = this.RULE('arrow', () => {
            this.OR([
                { ALT: () => this.CONSUME(t.BidirAsyncDotted) },
                { ALT: () => this.CONSUME(t.BidirAsync) },
                { ALT: () => this.CONSUME(t.DottedAsync) },
                { ALT: () => this.CONSUME(t.Async) },
                { ALT: () => this.CONSUME(t.Dotted) },
                { ALT: () => this.CONSUME(t.Solid) },
                { ALT: () => this.CONSUME(t.DottedCross) },
                { ALT: () => this.CONSUME(t.Cross) },
                { ALT: () => this.CONSUME(t.DottedOpen) },
                { ALT: () => this.CONSUME(t.Open) },
            ]);
        });
        // Blocks
        this.altBlock = this.RULE('altBlock', () => {
            this.CONSUME(t.AltKeyword);
            this.OPTION(() => this.SUBRULE(this.lineRemainder));
            this.AT_LEAST_ONE(() => this.CONSUME(t.Newline));
            this.MANY(() => this.SUBRULE(this.line));
            this.MANY2(() => {
                this.CONSUME(t.ElseKeyword);
                this.OPTION2(() => this.SUBRULE2(this.lineRemainder));
                this.AT_LEAST_ONE2(() => this.CONSUME2(t.Newline));
                this.MANY3(() => this.SUBRULE2(this.line));
            });
            this.CONSUME(t.EndKeyword);
            this.OR3([
                { ALT: () => this.AT_LEAST_ONE3(() => this.CONSUME3(t.Newline)) },
                { ALT: () => this.CONSUME3(EOF) }
            ]);
        });
        this.optBlock = this.RULE('optBlock', () => {
            this.CONSUME(t.OptKeyword);
            this.OPTION(() => this.SUBRULE(this.lineRemainder));
            this.AT_LEAST_ONE(() => this.CONSUME(t.Newline));
            this.MANY(() => this.SUBRULE(this.line));
            this.CONSUME(t.EndKeyword);
            this.OR2([
                { ALT: () => this.AT_LEAST_ONE2(() => this.CONSUME2(t.Newline)) },
                { ALT: () => this.CONSUME2(EOF) }
            ]);
        });
        this.loopBlock = this.RULE('loopBlock', () => {
            this.CONSUME(t.LoopKeyword);
            this.OPTION(() => this.SUBRULE(this.lineRemainder));
            this.AT_LEAST_ONE(() => this.CONSUME(t.Newline));
            this.MANY(() => this.SUBRULE(this.line));
            this.CONSUME(t.EndKeyword);
            this.OR2([
                { ALT: () => this.AT_LEAST_ONE2(() => this.CONSUME2(t.Newline)) },
                { ALT: () => this.CONSUME2(EOF) }
            ]);
        });
        this.parBlock = this.RULE('parBlock', () => {
            this.CONSUME(t.ParKeyword);
            this.OPTION(() => this.SUBRULE(this.parHeader));
            this.AT_LEAST_ONE(() => this.CONSUME(t.Newline));
            this.MANY(() => this.SUBRULE(this.line));
            this.MANY2(() => {
                this.CONSUME(t.AndKeyword);
                this.OPTION2(() => this.SUBRULE2(this.lineRemainder));
                this.AT_LEAST_ONE2(() => this.CONSUME2(t.Newline));
                this.MANY3(() => this.SUBRULE2(this.line));
            });
            this.CONSUME(t.EndKeyword);
            this.OR3([
                { ALT: () => this.AT_LEAST_ONE3(() => this.CONSUME3(t.Newline)) },
                { ALT: () => this.CONSUME3(EOF) }
            ]);
        });
        this.parHeader = this.RULE('parHeader', () => {
            this.OR([
                {
                    GATE: () => this.LA(1).tokenType === t.OverKeyword,
                    ALT: () => {
                        this.CONSUME(t.OverKeyword);
                        this.SUBRULE(this.actorRef);
                        this.OPTION(() => { this.CONSUME(t.Comma); this.SUBRULE2(this.actorRef); });
                        this.OPTION1(() => this.SUBRULE(this.lineRemainder));
                    }
                },
                { ALT: () => this.SUBRULE2(this.lineRemainder) }
            ]);
        });
        this.criticalBlock = this.RULE('criticalBlock', () => {
            this.CONSUME(t.CriticalKeyword);
            this.OPTION(() => this.SUBRULE(this.lineRemainder));
            this.AT_LEAST_ONE(() => this.CONSUME(t.Newline));
            this.MANY(() => this.SUBRULE(this.line));
            this.MANY2(() => {
                this.CONSUME(t.OptionKeyword);
                this.OPTION2(() => this.SUBRULE2(this.lineRemainder));
                this.AT_LEAST_ONE2(() => this.CONSUME2(t.Newline));
                this.MANY3(() => this.SUBRULE2(this.line));
            });
            this.CONSUME(t.EndKeyword);
            this.AT_LEAST_ONE3(() => this.CONSUME3(t.Newline));
        });
        this.breakBlock = this.RULE('breakBlock', () => {
            this.CONSUME(t.BreakKeyword);
            this.OPTION(() => this.SUBRULE(this.lineRemainder));
            this.AT_LEAST_ONE(() => this.CONSUME(t.Newline));
            this.MANY(() => this.SUBRULE(this.line));
            this.CONSUME(t.EndKeyword);
            this.OR2([
                { ALT: () => this.AT_LEAST_ONE2(() => this.CONSUME2(t.Newline)) },
                { ALT: () => this.CONSUME2(EOF) }
            ]);
        });
        this.rectBlock = this.RULE('rectBlock', () => {
            this.CONSUME(t.RectKeyword);
            this.OPTION(() => this.SUBRULE(this.lineRemainder));
            this.AT_LEAST_ONE(() => this.CONSUME(t.Newline));
            this.MANY(() => this.SUBRULE(this.line));
            this.CONSUME(t.EndKeyword);
            this.OR2([
                { ALT: () => this.AT_LEAST_ONE2(() => this.CONSUME2(t.Newline)) },
                { ALT: () => this.CONSUME2(EOF) }
            ]);
        });
        this.boxBlock = this.RULE('boxBlock', () => {
            this.CONSUME(t.BoxKeyword);
            this.OPTION(() => this.SUBRULE(this.lineRemainder));
            this.AT_LEAST_ONE(() => this.CONSUME(t.Newline));
            this.MANY(() => this.OR([
                { ALT: () => this.SUBRULE(this.participantDecl) },
                { ALT: () => this.SUBRULE(this.blankLine) },
            ]));
            this.CONSUME(t.EndKeyword);
            this.OR2([
                { ALT: () => this.AT_LEAST_ONE2(() => this.CONSUME2(t.Newline)) },
                { ALT: () => this.CONSUME2(EOF) }
            ]);
        });
        this.lineRemainder = this.RULE('lineRemainder', () => {
            this.AT_LEAST_ONE(() => this.OR(TEXT_TOKENS.map((tk) => ({ ALT: () => this.CONSUME(tk) }))));
        });
        this.performSelfAnalysis();
    }
}
export const parserInstance = new SequenceParser();
export function parse(tokens) {
    parserInstance.input = tokens;
    const cst = parserInstance.diagram();
    return { cst, errors: parserInstance.errors };
}
//# sourceMappingURL=parser.js.map