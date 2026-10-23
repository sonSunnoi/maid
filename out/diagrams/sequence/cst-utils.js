export function textFromTokens(tokens) {
    if (!tokens || tokens.length === 0)
        return '';
    const parts = [];
    for (const t of tokens) {
        const img = t.image ?? '';
        const name = t.tokenType?.name;
        if (name === 'QuotedString') {
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
export function actorRefToText(refCst) {
    if (!refCst)
        return '';
    const ch = (refCst.children || {});
    const toks = [];
    ['Identifier', 'QuotedString', 'NumberLiteral', 'Text'].forEach((k) => {
        const a = ch[k];
        a?.forEach(t => toks.push(t));
    });
    toks.sort((a, b) => (a.startOffset ?? 0) - (b.startOffset ?? 0));
    return textFromTokens(toks);
}
export function lineRemainderToText(lineRem) {
    if (!lineRem)
        return undefined;
    const toks = [];
    for (const value of Object.values((lineRem.children || {}))) {
        for (const item of value) {
            if (item && typeof item.image === 'string')
                toks.push(item);
        }
    }
    toks.sort((a, b) => (a.startOffset ?? 0) - (b.startOffset ?? 0));
    const txt = textFromTokens(toks);
    return txt || undefined;
}
//# sourceMappingURL=cst-utils.js.map