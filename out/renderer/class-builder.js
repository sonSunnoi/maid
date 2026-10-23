import { tokenize as lexClass } from '../diagrams/class/lexer.js';
import { parserInstance } from '../diagrams/class/parser.js';
function textFromTokens(tokens) {
    if (!tokens || tokens.length === 0)
        return '';
    const parts = [];
    for (const t of tokens) {
        const img = t.image ?? '';
        if (t.tokenType && t.tokenType.name === 'QuotedString') {
            if (img.startsWith('"') && img.endsWith('"'))
                parts.push(img.slice(1, -1));
            else if (img.startsWith("'") && img.endsWith("'"))
                parts.push(img.slice(1, -1));
            else
                parts.push(img);
        }
        else {
            parts.push(img);
        }
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
}
function classRefToText(refCst) {
    if (!refCst)
        return '';
    const ch = (refCst.children || {});
    const toks = [];
    ['Identifier', 'QuotedString', 'BacktickName'].forEach((k) => {
        const arr = ch[k];
        arr?.forEach(t => toks.push(t));
    });
    toks.sort((a, b) => (a.startOffset ?? 0) - (b.startOffset ?? 0));
    return textFromTokens(toks);
}
function memberLineToText(member) {
    const ch = (member.children || {});
    // Visibility + name + optional (params) + optional : type
    const toks = [];
    const order = ['Visibility', 'Identifier', 'QuotedString', 'LParen', 'RParen', 'Comma', 'Colon', 'NumberLiteral'];
    for (const k of order)
        ch[k]?.forEach(t => toks.push(t));
    toks.sort((a, b) => (a.startOffset ?? 0) - (b.startOffset ?? 0));
    const txt = textFromTokens(toks);
    const isMethod = /(\)\s*:|\)$)/.test(txt) || /\(/.test(txt);
    return { text: txt, isMethod };
}
function canonicalId(raw) { return raw.trim().replace(/\s+/g, '_'); }
export function buildClassModel(text) {
    const { tokens } = lexClass(text);
    parserInstance.input = tokens;
    const cst = parserInstance.diagram();
    const classes = new Map();
    const relations = [];
    const notes = [];
    let direction = 'TD';
    function ensureClass(idRaw, display) {
        const id = canonicalId(idRaw);
        const existing = classes.get(id);
        if (existing)
            return existing;
        const def = { id, display: display || idRaw, attributes: [], methods: [] };
        classes.set(id, def);
        return def;
    }
    // Walk statements
    const diagramChildren = (cst.children || {});
    const stmts = diagramChildren.statement || [];
    for (const st of stmts) {
        const ch = (st.children || {});
        if (ch.directionStmt) {
            const d = ch.directionStmt[0].children.Direction?.[0]?.image || 'TD';
            if (d === 'TB')
                direction = 'TB';
            else if (d === 'BT')
                direction = 'BT';
            else if (d === 'LR')
                direction = 'LR';
            else if (d === 'RL')
                direction = 'RL';
            else
                direction = 'TD';
            continue;
        }
        if (ch.classLine) {
            const node = ch.classLine[0];
            const nch = (node.children || {});
            const name = classRefToText(nch.classRef?.[0]);
            const def = ensureClass(name);
            // Optional label and stereotype/alias
            if (nch.LTlt && nch.Identifier && nch.GTgt) {
                def.stereotype = nch.Identifier[0].image;
            }
            // Inline block of members
            if (nch.LCurly && nch.memberLineStmt) {
                const lines = nch.memberLineStmt;
                for (const m of lines) {
                    const mm = memberLineToText(m.children.memberLine?.[0]);
                    if (!mm.text)
                        continue;
                    (mm.isMethod ? def.methods : def.attributes).push(mm.text);
                }
            }
            continue;
        }
        if (ch.memberAssignStmt) {
            const node = ch.memberAssignStmt[0];
            const nch = (node.children || {});
            const clsName = classRefToText(nch.classRef?.[0]);
            const def = ensureClass(clsName);
            const mm = memberLineToText((nch.memberLine?.[0]));
            if (mm.text)
                (mm.isMethod ? def.methods : def.attributes).push(mm.text);
            continue;
        }
        if (ch.noteStmt) {
            const node = ch.noteStmt[0];
            const nch = (node.children || {});
            const target = classRefToText(nch.classRef?.[0]);
            const labelToks = [];
            ['QuotedString', 'Identifier', 'NumberLiteral'].forEach(k => nch[k]?.forEach(t => labelToks.push(t)));
            const text = textFromTokens(labelToks);
            if (target && text)
                notes.push({ target: canonicalId(target), text });
            continue;
        }
        if (ch.relationStmt) {
            const node = ch.relationStmt[0];
            const rch = (node.children || {});
            const leftName = classRefToText(rch.classRef?.[0]);
            const rightName = classRefToText(rch.classRef?.[1]);
            const left = ensureClass(leftName).id;
            const right = ensureClass(rightName).id;
            // Cardinalities: use labeled CST fields when present
            const leftCardTok = rch.leftCard?.[0];
            const rightCardTok = rch.rightCard?.[0];
            const leftCard = leftCardTok?.image ? leftCardTok.image.slice(1, -1) : undefined;
            const rightCard = rightCardTok?.image ? rightCardTok.image.slice(1, -1) : undefined;
            // Label after colon (one or more labelText entries)
            let label;
            if (rch.labelText) {
                const toks = [];
                rch.labelText.forEach((lt) => {
                    const ch2 = lt.children || {};
                    ['QuotedString', 'Identifier', 'NumberLiteral', 'GenericAngle'].forEach((k) => {
                        ch2[k]?.forEach(t => toks.push(t));
                    });
                });
                toks.sort((a, b) => (a.startOffset ?? 0) - (b.startOffset ?? 0));
                label = textFromTokens(toks);
            }
            // Determine kind from which relation operator is present
            const relMap = [
                { key: 'RelAssociation', kind: 'association' },
                { key: 'RelDependency', kind: 'dependency' },
                { key: 'RelRealization', kind: 'realization' },
                { key: 'RelExtends', kind: 'extends' },
                { key: 'RelAggregation', kind: 'aggregation' },
                { key: 'RelComposition', kind: 'composition' },
                { key: 'RelDependencyLeft', kind: 'dependency' },
                { key: 'RelRealizationLeft', kind: 'realization' },
                { key: 'RelExtendsRight', kind: 'extends' },
                { key: 'RelAggBoth', kind: 'aggregation-both' },
                { key: 'RelCompBoth', kind: 'composition-both' },
                { key: 'RelAggToComp', kind: 'aggregation-to-comp' },
                { key: 'RelCompToAgg', kind: 'composition-to-agg' },
                { key: 'LollipopLeft', kind: 'lollipop-left' },
                { key: 'LollipopRight', kind: 'lollipop-right' },
            ];
            let kind = 'association';
            for (const m of relMap) {
                if (rch[m.key]) {
                    kind = m.kind;
                    break;
                }
            }
            // Normalize direction: model edges go left->right in the written order; for leftward ops we swap
            // Leftward tokens set above; here adjust for extends-left style where triangle sits near left class
            let src = left, dst = right;
            if (rch.RelExtends || rch.RelDependencyLeft || rch.RelRealizationLeft || rch.LollipopLeft) {
                // These place the special marker near the left class: edge is right -> left
                src = right;
                dst = left;
            }
            const rel = { source: src, target: dst, kind, label, leftCard, rightCard };
            relations.push(rel);
            continue;
        }
    }
    return {
        direction,
        classes: Array.from(classes.values()),
        relations,
        notes,
    };
}
//# sourceMappingURL=class-builder.js.map