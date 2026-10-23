/**
 * Transforms a Chevrotain CST into a graph model suitable for rendering
 */
export class GraphBuilder {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
        this.nodeCounter = 0;
        this.edgeCounter = 0;
        this.subgraphs = [];
        this.currentSubgraphStack = [];
        this.pendingLinkStyles = [];
        // Styling support (classDef/class/style)
        this.classStyles = new Map();
        this.nodeStyles = new Map();
        this.nodeClasses = new Map();
        this.edgeClasses = new Map();
        this.edgeStyles = new Map();
        this.nodeLinks = new Map();
    }
    build(cst) {
        this.reset();
        // Handle undefined CST (parser errors)
        if (!cst || !cst.children) {
            return {
                nodes: [],
                edges: [],
                direction: 'TD',
                subgraphs: []
            };
        }
        const direction = this.extractDirection(cst);
        this.processStatements(cst);
        // Apply any collected node links onto nodes (if node exists)
        for (const [id, link] of this.nodeLinks.entries()) {
            const node = this.nodes.get(id);
            if (node)
                node.link = link;
        }
        return {
            nodes: Array.from(this.nodes.values()),
            edges: this.edges,
            direction,
            subgraphs: this.subgraphs
        };
    }
    reset() {
        this.nodes.clear();
        this.edges = [];
        this.nodeCounter = 0;
        this.edgeCounter = 0;
        this.subgraphs = [];
        this.currentSubgraphStack = [];
        this.classStyles.clear();
        this.nodeStyles.clear();
        this.nodeClasses.clear();
        this.edgeClasses.clear();
        this.edgeStyles.clear();
        this.pendingLinkStyles = [];
        this.nodeLinks.clear();
    }
    extractDirection(cst) {
        const dirToken = cst.children?.Direction?.[0];
        const dir = dirToken?.image?.toUpperCase();
        switch (dir) {
            case 'TB':
            case 'TD': return 'TD';
            case 'BT': return 'BT';
            case 'LR': return 'LR';
            case 'RL': return 'RL';
            default: return 'TD';
        }
    }
    processStatements(cst) {
        const statements = cst.children?.statement;
        if (!statements)
            return;
        for (const stmt of statements) {
            if (stmt.children?.nodeStatement) {
                this.processNodeStatement(stmt.children.nodeStatement[0]);
            }
            else if (stmt.children?.subgraph) {
                this.processSubgraph(stmt.children.subgraph[0]);
            }
            else if (stmt.children?.classDefStatement) {
                this.processClassDef(stmt.children.classDefStatement[0]);
            }
            else if (stmt.children?.classStatement) {
                this.processClassAssign(stmt.children.classStatement[0]);
            }
            else if (stmt.children?.styleStatement) {
                this.processStyle(stmt.children.styleStatement[0]);
            }
            else if (stmt.children?.linkStyleStatement) {
                this.processLinkStyle(stmt.children.linkStyleStatement[0]);
            }
            else if (stmt.children?.clickStatement) {
                this.processClick(stmt.children.clickStatement[0]);
            }
            else if (stmt.children?.edgeAttrStatement) {
                this.processEdgeAttr(stmt.children.edgeAttrStatement[0]);
            }
            // Skip class, style, and other statements for now
        }
        // Apply pending link styles to edges after all edges have been created
        this.applyLinkStyles();
    }
    unquote(s) {
        if (!s)
            return s;
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))
            return s.slice(1, -1);
        return s;
    }
    processClick(cst) {
        const ch = (cst.children || {});
        const tgtTok = ch.clickTarget?.[0];
        if (!tgtTok)
            return;
        const id = tgtTok.image;
        const link = {};
        if (ch.clickHref && ch.clickHref[0]) {
            const hrefCh = (ch.clickHref[0].children || {});
            if (hrefCh.url && hrefCh.url[0])
                link.href = this.unquote(hrefCh.url[0].image);
            if (hrefCh.tooltip && hrefCh.tooltip[0])
                link.tooltip = this.unquote(hrefCh.tooltip[0].image);
            if (hrefCh.target && hrefCh.target[0])
                link.target = hrefCh.target[0].image;
        }
        else if (ch.clickCall && ch.clickCall[0]) {
            const callCh = (ch.clickCall[0].children || {});
            if (callCh.fn && callCh.fn[0])
                link.call = callCh.fn[0].image;
            if (callCh.tooltip && callCh.tooltip[0])
                link.tooltip = this.unquote(callCh.tooltip[0].image);
        }
        else {
            // Legacy fallback
            const idents = ch.Identifier || [];
            const texts = ch.Text || [];
            const quotes = ch.QuotedString || [];
            const modeTok = idents.find(t => /^(href|call|callback)$/i.test(t.image));
            const mode = modeTok?.image?.toLowerCase();
            if (mode === 'href') {
                const urlTok = quotes[0];
                const tipTok = quotes[1];
                const targetTok = idents.find(t => /^_(blank|self|parent|top)$/i.test(t.image));
                if (urlTok)
                    link.href = this.unquote(urlTok.image);
                if (tipTok)
                    link.tooltip = this.unquote(tipTok.image);
                if (targetTok)
                    link.target = targetTok.image;
            }
            else if (mode === 'call' || mode === 'callback') {
                const reserved = new Set(['href', 'call', 'callback', '_blank', '_self', '_parent', '_top']);
                const after = idents.filter(t => (t.startOffset ?? 0) > (modeTok?.startOffset ?? -1));
                const nameTok = after.find(t => !reserved.has(t.image.toLowerCase()));
                const tstr = texts.map(t => t.image).join(' ').trim();
                link.call = nameTok ? nameTok.image + (tstr ? ` ${tstr}` : '') : (tstr || undefined);
                const tipTok = quotes[0];
                if (tipTok)
                    link.tooltip = this.unquote(tipTok.image);
            }
        }
        if (Object.keys(link).length)
            this.nodeLinks.set(id, { ...(this.nodeLinks.get(id) || {}), ...link });
    }
    processNodeStatement(stmt) {
        const groups = stmt.children?.nodeOrParallelGroup;
        const links = stmt.children?.link;
        if (!groups || groups.length === 0)
            return;
        // Detect a lone "id@{ ... }" line (no links, single node in group) and treat as edge attribute update if the id matches an existing edge.
        if ((!links || links.length === 0) && groups.length === 1) {
            const g0 = groups[0];
            const nodes = g0.children?.node || [];
            if (nodes.length === 1) {
                const n = nodes[0];
                const hasAttr = !!(n.children.attrObject && n.children.attrObject.length);
                const hasShape = !!(n.children?.nodeShape);
                if (hasAttr && !hasShape) {
                    const idTok = n.children.nodeId?.[0] || n.children.Identifier?.[0] || undefined;
                    if (idTok) {
                        const id = idTok.image;
                        const exists = this.edges.some(e => e.id === id);
                        if (exists) {
                            // Reuse edge attr processing logic by synthesizing a small CST-like node containing edgeId + attrObject
                            const edgeAttrFake = { children: { edgeId: [{ image: id }], attrObject: n.children.attrObject } };
                            this.processEdgeAttr(edgeAttrFake);
                            return; // do not process as a node statement
                        }
                    }
                }
            }
        }
        // Process first group of nodes
        const sourceNodes = this.processNodeGroup(groups[0]);
        if (groups.length > 1 && links && links.length > 0) {
            // Has connections
            const targetNodes = this.processNodeGroup(groups[1]);
            const linkInfo = this.extractLinkInfo(links[0]);
            // Create edges from all source nodes to all target nodes
            for (const source of sourceNodes) {
                for (const target of targetNodes) {
                    this.edges.push({
                        id: linkInfo.edgeId || `e${this.edgeCounter++}`,
                        source,
                        target,
                        label: linkInfo.label,
                        type: linkInfo.type,
                        markerStart: linkInfo.markerStart,
                        markerEnd: linkInfo.markerEnd
                    });
                }
            }
            // Process chain (A --> B --> C)
            for (let i = 2; i < groups.length; i++) {
                const nextNodes = this.processNodeGroup(groups[i]);
                const nextLink = links[i - 1] ? this.extractLinkInfo(links[i - 1]) : linkInfo;
                for (const source of targetNodes) {
                    for (const target of nextNodes) {
                        this.edges.push({
                            id: nextLink.edgeId || `e${this.edgeCounter++}`,
                            source,
                            target,
                            label: nextLink.label,
                            type: nextLink.type,
                            markerStart: nextLink.markerStart,
                            markerEnd: nextLink.markerEnd
                        });
                    }
                }
                targetNodes.length = 0;
                targetNodes.push(...nextNodes);
            }
        }
    }
    processNodeGroup(group) {
        const nodes = group.children?.node;
        if (!nodes)
            return [];
        const nodeIds = [];
        for (const node of nodes) {
            const nodeInfo = this.extractNodeInfo(node);
            if (nodeInfo) {
                // Check if this ID is a subgraph - if so, don't add as a node
                const isSubgraph = this.subgraphs.some(sg => sg.id === nodeInfo.id);
                if (!isSubgraph) {
                    // Add or update node only if it's not a subgraph
                    if (!this.nodes.has(nodeInfo.id)) {
                        // Apply any known styles/classes to the node on first creation
                        nodeInfo.style = this.computeNodeStyle(nodeInfo.id);
                        this.nodes.set(nodeInfo.id, nodeInfo);
                    }
                    else {
                        // Update existing node only if new info has actual shape/label definition
                        const existing = this.nodes.get(nodeInfo.id);
                        // Only update label if the new node has explicit shape definition (not just ID reference)
                        if (nodeInfo.shape !== 'rectangle' || nodeInfo.label !== nodeInfo.id) {
                            if (nodeInfo.label !== nodeInfo.id) {
                                existing.label = nodeInfo.label;
                            }
                            if (nodeInfo.shape !== 'rectangle') {
                                existing.shape = nodeInfo.shape;
                            }
                        }
                        // Merge styles if we learned about class/style later
                        const merged = this.computeNodeStyle(nodeInfo.id);
                        if (Object.keys(merged).length) {
                            existing.style = { ...(existing.style || {}), ...merged };
                        }
                    }
                    // Track subgraph membership
                    if (this.currentSubgraphStack.length) {
                        for (const sgId of this.currentSubgraphStack) {
                            const subgraph = this.subgraphs.find(s => s.id === sgId);
                            if (subgraph && !subgraph.nodes.includes(nodeInfo.id)) {
                                subgraph.nodes.push(nodeInfo.id);
                            }
                        }
                    }
                }
                // Always add to nodeIds for edge creation (subgraph edges are valid)
                nodeIds.push(nodeInfo.id);
            }
        }
        return nodeIds;
    }
    extractNodeInfo(node) {
        const children = node.children;
        if (!children)
            return null;
        // Extract node ID
        let id;
        if (children.nodeId) {
            id = children.nodeId[0].image;
            if (children.nodeIdSuffix) {
                id += children.nodeIdSuffix[0].image;
            }
        }
        else if (children.nodeIdNum) {
            id = children.nodeIdNum[0].image;
        }
        else if (children.Identifier) {
            id = children.Identifier[0].image;
        }
        else {
            return null;
        }
        // Extract shape and label (bracket-based)
        let shape = 'rectangle';
        let label = id; // Default label is the ID
        const shapeNode = children.nodeShape?.[0];
        if (shapeNode?.children) {
            const result = this.extractShapeAndLabel(shapeNode);
            shape = result.shape;
            if (result.label)
                label = result.label;
        }
        // Typed-shape attribute object after node id (A@{ ... })
        const attrNode = children.attrObject?.[0];
        let typedShape;
        if (attrNode && !shapeNode) {
            typedShape = this.parseTypedAttrObject(attrNode);
            if (typedShape.shape) {
                const m = typedShape.shape;
                if (m === 'rect')
                    shape = 'rectangle';
                else if (m === 'round' || m === 'rounded')
                    shape = 'round';
                else if (m === 'stadium')
                    shape = 'stadium';
                else if (m === 'subroutine')
                    shape = 'subroutine';
                else if (m === 'circle')
                    shape = 'circle';
                else if (m === 'cylinder')
                    shape = 'cylinder';
                else if (m === 'diamond')
                    shape = 'diamond';
                else if (m === 'trapezoid')
                    shape = 'trapezoid';
                else if (m === 'trapezoidAlt')
                    shape = 'trapezoidAlt';
                else if (m === 'parallelogram' || m === 'lean-l' || m === 'lean-r') {
                    shape = 'parallelogram';
                    typedShape.lean = (m === 'lean-l' ? 'l' : (m === 'lean-r' ? 'r' : undefined));
                }
                else if (m === 'hexagon')
                    shape = 'hexagon';
                else if (m === 'icon' || m === 'image')
                    shape = 'rectangle';
            }
            if (typeof typedShape.label === 'string' && typedShape.label.length > 0) {
                label = typedShape.label;
            }
        }
        // Capture inline class annotation if present
        const clsTok = children.nodeClass?.[0];
        if (clsTok) {
            const set = this.nodeClasses.get(id) || new Set();
            set.add(clsTok.image);
            this.nodeClasses.set(id, set);
        }
        const out = { id, label, shape };
        if (typedShape) {
            const padding = typedShape.padding;
            const cornerRadius = typedShape.cornerRadius;
            const lean = typedShape.lean;
            const media = (typedShape.icon || typedShape.image) ? { icon: typedShape.icon, image: typedShape.image } : undefined;
            out.typed = { padding, cornerRadius, lean, media };
        }
        return out;
    }
    parseTypedAttrObject(attrNode) {
        const ch = (attrNode.children || {});
        const pairs = (ch.attrPair || []);
        const out = {};
        for (const p of pairs) {
            const keyTok = p.children?.attrKey?.[0];
            if (!keyTok)
                continue;
            const k = keyTok.image;
            const vTok = (p.children?.QuotedString?.[0] || p.children?.Identifier?.[0] || p.children?.NumberLiteral?.[0] || p.children?.Text?.[0]);
            if (!vTok)
                continue;
            let raw = vTok.image;
            if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'")))
                raw = raw.slice(1, -1);
            switch (k) {
                case 'shape':
                    out.shape = raw;
                    break;
                case 'label':
                    out.label = raw;
                    break;
                case 'padding': {
                    const n = parseFloat(raw);
                    if (Number.isFinite(n))
                        out.padding = n;
                    break;
                }
                case 'cornerRadius': {
                    const n = parseFloat(raw);
                    if (Number.isFinite(n))
                        out.cornerRadius = n;
                    break;
                }
                case 'icon':
                    out.icon = raw;
                    break;
                case 'image':
                    out.image = raw;
                    break;
            }
        }
        return out;
    }
    extractShapeAndLabel(shapeNode) {
        const children = shapeNode.children;
        let shape = 'rectangle';
        let label = '';
        // Extract label from nodeContent first to check for special patterns
        const contentNodes = children?.nodeContent;
        if (contentNodes && contentNodes.length > 0) {
            label = this.extractTextContent(contentNodes[0]);
        }
        // Detect shape based on opening token
        if (children?.SquareOpen) {
            // Default rectangle; try to detect angled variants by looking at first/last token inside nodeContent
            shape = 'rectangle';
            const contentNode = children.nodeContent?.[0];
            if (contentNode) {
                const c = contentNode.children;
                const tokTypes = ['ForwardSlash', 'Backslash', 'Identifier', 'Text', 'NumberLiteral', 'RoundOpen', 'RoundClose', 'AngleLess', 'AngleOpen', 'Comma', 'Colon', 'Ampersand', 'Semicolon', 'TwoDashes', 'Line', 'ThickLine', 'DottedLine'];
                const toks = [];
                for (const tt of tokTypes) {
                    const arr = c[tt];
                    arr?.forEach((t) => toks.push({ type: tt, t, start: t.startOffset ?? 0 }));
                }
                if (toks.length >= 2) {
                    toks.sort((a, b) => a.start - b.start);
                    const first = toks[0].type;
                    const last = toks[toks.length - 1].type;
                    if ((first === 'ForwardSlash' && last === 'ForwardSlash') || (first === 'Backslash' && last === 'Backslash')) {
                        shape = 'parallelogram';
                        // Remove outer markers from the label later when extracting text
                    }
                    else if (first === 'ForwardSlash' && last === 'Backslash') {
                        // [/text\] top narrow
                        shape = 'trapezoid';
                    }
                    else if (first === 'Backslash' && last === 'ForwardSlash') {
                        // [\text/] bottom narrow
                        shape = 'trapezoidAlt';
                    }
                }
            }
        }
        else if (children?.RoundOpen) {
            shape = 'round';
        }
        else if (children?.DiamondOpen) {
            shape = 'diamond';
        }
        else if (children?.DoubleRoundOpen) {
            shape = 'circle';
        }
        else if (children?.StadiumOpen) {
            shape = 'stadium';
        }
        else if (children?.HexagonOpen) {
            shape = 'hexagon';
        }
        else if (children?.DoubleSquareOpen) {
            shape = 'subroutine';
        }
        else if (children?.CylinderOpen) {
            shape = 'cylinder';
        }
        else if (children?.TrapezoidOpen) {
            shape = 'trapezoid';
        }
        else if (children?.ParallelogramOpen) {
            shape = 'parallelogram';
        }
        return { shape, label };
    }
    extractTextContent(contentNode) {
        const children = contentNode.children;
        if (!children)
            return '';
        // Collect all text tokens with their positions.
        // Important: include AngleLess ('<') and AngleOpen ('>') so inline HTML like <br/> survives
        // extraction and can be rendered as line breaks/styled text by the SVG generator.
        const tokenTypes = [
            'Text', 'Identifier', 'QuotedString', 'NumberLiteral',
            'Ampersand', 'Comma', 'Colon', 'Semicolon', 'Dot', 'Underscore', 'Dash',
            'ForwardSlash', 'Backslash', 'AngleLess', 'AngleOpen'
        ];
        const tokenWithPositions = [];
        for (const type of tokenTypes) {
            const tokens = children[type];
            if (tokens) {
                for (const token of tokens) {
                    let text = token.image;
                    // Remove quotes from quoted strings
                    if (type === 'QuotedString' && text.startsWith('"') && text.endsWith('"')) {
                        text = text.slice(1, -1);
                    }
                    // Strip outer angle markers for parallelogram/trapezoid detection from visible label if they are at extremes
                    if ((type === 'ForwardSlash' || type === 'Backslash') && (tokenWithPositions.length === 0)) {
                        // leading marker: skip adding now; we'll keep inner slashes
                        continue;
                    }
                    tokenWithPositions.push({
                        text,
                        startOffset: token.startOffset ?? 0,
                        type
                    });
                }
            }
        }
        // Sort by position to preserve original order
        tokenWithPositions.sort((a, b) => a.startOffset - b.startOffset);
        // Trim leading/trailing marker if present
        if (tokenWithPositions.length) {
            const first = tokenWithPositions[0];
            if (first.type === 'ForwardSlash' || first.type === 'Backslash') {
                tokenWithPositions.shift();
            }
            const last = tokenWithPositions[tokenWithPositions.length - 1];
            if (last.type === 'ForwardSlash' || last.type === 'Backslash') {
                tokenWithPositions.pop();
            }
        }
        // Extract just the text in correct order
        const parts = tokenWithPositions.map(t => t.text);
        // Handle spaces
        if (children.Space) {
            // If we have explicit spaces, use them
            return parts.join('');
        }
        // Otherwise join with spaces
        return parts.join(' ').trim();
    }
    extractLinkInfo(link) {
        const children = link.children;
        let type = 'arrow';
        let label;
        let markerStart = 'none';
        let markerEnd = 'none';
        const eidTok = children.edgeId?.[0];
        // Determine arrow type
        if (children.BiDirectionalArrow) {
            type = 'arrow';
            markerStart = 'arrow';
            markerEnd = 'arrow';
        }
        else if (children.CircleEndLine) {
            type = 'open';
            markerStart = 'circle';
            markerEnd = 'circle';
        }
        else if (children.CrossEndLine) {
            type = 'open';
            markerStart = 'cross';
            markerEnd = 'cross';
        }
        else if (children?.ArrowRight) {
            type = 'arrow';
            markerEnd = 'arrow';
        }
        else if (children?.ArrowLeft) {
            type = 'arrow';
            markerStart = 'arrow';
        }
        else if (children?.DottedArrowRight) {
            type = 'dotted';
            markerEnd = 'arrow';
        }
        else if (children?.DottedArrowLeft) {
            type = 'dotted';
            markerStart = 'arrow';
        }
        else if (children?.ThickArrowRight) {
            type = 'thick';
            markerEnd = 'arrow';
        }
        else if (children?.ThickArrowLeft) {
            type = 'thick';
            markerStart = 'arrow';
        }
        else if (children?.LinkRight || children?.LinkLeft || children?.Line || children?.TwoDashes || children?.DottedLine || children?.ThickLine) {
            if (children?.DottedLine)
                type = 'dotted';
            else if (children?.ThickLine)
                type = 'thick';
            else
                type = 'open';
        }
        else if (children?.InvisibleLink) {
            type = 'invisible';
        }
        // Fallbacks: handle patterns where style and arrow are split by a label
        // e.g., "-.text.->" tokenizes as DottedLine + inlineCarrier + ArrowRight
        if (markerEnd === 'none' && (children?.ArrowRight || children.ThickArrowRight || children.DottedArrowRight)) {
            markerEnd = 'arrow';
        }
        if (markerStart === 'none' && (children?.ArrowLeft || children.ThickArrowLeft || children.DottedArrowLeft)) {
            markerStart = 'arrow';
        }
        // Extract link label (priority: |text|, then inline text, then inline carrier)
        const textNode = children?.linkText?.[0];
        if (textNode) {
            label = this.extractTextContent(textNode);
        }
        else if (children.linkTextInline?.[0]) {
            label = this.extractTextContent(children.linkTextInline[0]);
        }
        else if (children.inlineCarrier?.[0]) {
            const token = children.inlineCarrier[0];
            const raw = token.image.trim();
            // Map carrier style to edge type. Examples:
            //  - -.text.-    => dotted
            //  - ==text==    => thick
            //  - -- text --  => open (normal)
            if (raw.startsWith('-.') && raw.endsWith('.-')) {
                type = 'dotted';
            }
            else if (raw.startsWith('==') && raw.endsWith('==')) {
                type = 'thick';
            }
            else if (raw.startsWith('--') && raw.endsWith('--')) {
                // keep default/open
            }
            // Prefer to show an arrowhead when there is any arrow token to the right or left,
            // but some syntaxes split the style and arrow (e.g., '-.text.->', '==text==>').
            // Ensure markerEnd/Start are set when an arrow is present in the link.
            if (children.ArrowRight || children.DottedArrowRight || children.ThickArrowRight) {
                markerEnd = 'arrow';
            }
            if (children.ArrowLeft || children.DottedArrowLeft || children.ThickArrowLeft) {
                markerStart = 'arrow';
            }
            // Strip the outer markers from the label text for rendering
            const strip = (str) => {
                if ((str.startsWith('-.') && str.endsWith('.-')) || (str.startsWith('==') && str.endsWith('==')) || (str.startsWith('--') && str.endsWith('--'))) {
                    return str.slice(2, -2).trim();
                }
                return str;
            };
            label = strip(raw);
        }
        return { type, label, markerStart, markerEnd, edgeId: eidTok ? eidTok.image : undefined };
    }
    processSubgraph(subgraph) {
        const children = subgraph.children;
        // Extract subgraph ID and label
        let id = `subgraph_${this.subgraphs.length}`;
        let label;
        // Check for subgraphId token
        const idToken = (children?.subgraphId?.[0] || children?.Identifier?.[0]);
        if (idToken) {
            id = idToken.image;
        }
        // Label can be in: [Label], quoted title, or plain subgraphLabel (legacy)
        if (children?.SquareOpen && children?.nodeContent) {
            // Format: subgraph id[Label]
            label = this.extractTextContent(children.nodeContent[0]);
        }
        else if (children.subgraphTitleQ?.[0]) {
            // Format: subgraph "Label"
            const qt = children.subgraphTitleQ[0];
            const img = qt.image;
            label = img && img.length >= 2 && (img.startsWith('"') || img.startsWith("'")) ? img.slice(1, -1) : img;
        }
        else if (children?.subgraphLabel) {
            // Format: subgraph id Label (without brackets)
            label = this.extractTextContent(children.subgraphLabel[0]);
        }
        // If no explicit label was found, use the ID as the label
        if (!label && id !== `subgraph_${this.subgraphs.length}`) {
            label = id;
        }
        // Create subgraph
        const parent = this.currentSubgraphStack.length ? this.currentSubgraphStack[this.currentSubgraphStack.length - 1] : undefined;
        const sg = { id, label, nodes: [], parent };
        this.subgraphs.push(sg);
        // Process statements within subgraph
        this.currentSubgraphStack.push(id);
        const statements = children?.subgraphStatement;
        if (statements) {
            for (const stmt of statements) {
                if (stmt.children?.nodeStatement) {
                    this.processNodeStatement(stmt.children.nodeStatement[0]);
                }
                else if (stmt.children?.subgraph) {
                    this.processSubgraph(stmt.children.subgraph[0]);
                }
            }
        }
        this.currentSubgraphStack.pop();
    }
    // ---- Styling helpers ----
    processClassDef(cst) {
        const idTok = cst.children?.Identifier?.[0];
        if (!idTok)
            return;
        const className = idTok.image;
        const props = this.collectStyleProps(cst, { skipFirstIdentifier: true });
        if (Object.keys(props).length) {
            // debug: console.log('classDef', className, props);
            this.classStyles.set(className, props);
            // Re-apply to any existing nodes already assigned to this class
            for (const [nodeId, classes] of this.nodeClasses.entries()) {
                if (classes.has(className)) {
                    const node = this.nodes.get(nodeId);
                    if (node) {
                        node.style = { ...(node.style || {}), ...this.computeNodeStyle(nodeId) };
                    }
                }
            }
        }
    }
    processClassAssign(cst) {
        const ids = cst.children?.Identifier || [];
        if (!ids.length)
            return;
        // Last Identifier is className per grammar (LABEL: className)
        const classNameTok = cst.children.className?.[0];
        const className = classNameTok?.image || ids[ids.length - 1].image;
        const targetIds = classNameTok ? ids.slice(0, -1) : ids.slice(0, -1); // conservative
        for (const tok of targetIds) {
            const id = tok.image;
            // Assign to both nodes and edges; whichever exists will consume it
            const nset = this.nodeClasses.get(id) || new Set();
            nset.add(className);
            this.nodeClasses.set(id, nset);
            const eset = this.edgeClasses.get(id) || new Set();
            eset.add(className);
            this.edgeClasses.set(id, eset);
            // If node already exists, merge style now
            const node = this.nodes.get(id);
            if (node) {
                node.style = { ...(node.style || {}), ...this.computeNodeStyle(id) };
            }
        }
    }
    processStyle(cst) {
        const idTok = cst.children?.Identifier?.[0];
        if (!idTok)
            return;
        const nodeId = idTok.image;
        const props = this.collectStyleProps(cst, { skipFirstIdentifier: true });
        if (Object.keys(props).length) {
            this.nodeStyles.set(nodeId, props);
            const node = this.nodes.get(nodeId);
            if (node) {
                node.style = { ...(node.style || {}), ...this.computeNodeStyle(nodeId) };
            }
        }
    }
    collectStyleProps(cst, opts = {}) {
        const tokens = [];
        const ch = (cst.children || {});
        const push = (arr, type = 't') => arr?.forEach((t) => tokens.push({ text: t.image, startOffset: t.startOffset ?? 0, type }));
        push(ch.Text, 'Text');
        push(ch.Identifier, 'Identifier');
        push(ch.ColorValue, 'Color');
        push(ch.Colon, 'Colon');
        push(ch.Comma, 'Comma');
        push(ch.NumberLiteral, 'Number');
        // Sort to preserve original order
        tokens.sort((a, b) => a.startOffset - b.startOffset);
        // Optionally drop the first Identifier (class name or node id)
        if (opts.skipFirstIdentifier) {
            const idx = tokens.findIndex(t => t.type === 'Identifier');
            if (idx >= 0)
                tokens.splice(idx, 1);
        }
        const joined = tokens.map(t => t.text).join('');
        const props = {};
        for (const seg of joined.split(',').map(s => s.trim()).filter(Boolean)) {
            const [k, v] = seg.split(':');
            if (k && v)
                props[k.trim()] = v.trim();
        }
        return props;
    }
    processEdgeAttr(cst) {
        const eidTok = cst.children.edgeId?.[0];
        if (!eidTok)
            return;
        const id = eidTok.image;
        const attrNode = cst.children.attrObject?.[0];
        if (!attrNode)
            return;
        const ch = (attrNode.children || {});
        const pairs = (ch.attrPair || []);
        const props = {};
        for (const p of pairs) {
            const keyTok = p.children.attrKey?.[0];
            const vTok = (p.children.QuotedString?.[0] || p.children.Identifier?.[0] || p.children.NumberLiteral?.[0] || p.children.Text?.[0]);
            if (!keyTok || !vTok)
                continue;
            let val = vTok.image;
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
                val = val.slice(1, -1);
            const k = keyTok.image;
            if (k === 'animate') {
                // Default animation presets; user can override via animation key
                const truthy = /^(true|1|yes|on|fast|slow)$/i.test(val);
                if (truthy) {
                    props['animation'] = (/^slow$/i.test(val) ? 'dash 8s linear infinite' : (/^fast$/i.test(val) ? 'dash 2s linear infinite' : 'dash 4s linear infinite'));
                    if (!props['stroke-dasharray'])
                        props['stroke-dasharray'] = '5 5';
                }
            }
            else {
                props[k] = val;
            }
        }
        const cur = this.edgeStyles.get(id) || {};
        this.edgeStyles.set(id, { ...cur, ...props });
    }
    computeEdgeStyle(edgeId) {
        const out = {};
        const classes = this.edgeClasses.get(edgeId);
        if (classes) {
            for (const c of classes) {
                const s = this.classStyles.get(c);
                if (s)
                    Object.assign(out, this.normalizeStyle(s));
            }
        }
        const direct = this.edgeStyles.get(edgeId);
        if (direct)
            Object.assign(out, this.normalizeStyle(direct));
        return out;
    }
    processLinkStyle(cst) {
        const ch = (cst.children || {});
        // Prefer structured: linkStyleIndexList + linkStylePairs
        if (ch.linkStyleIndexList && ch.linkStylePairs) {
            const idxNode = ch.linkStyleIndexList[0];
            const pairNode = ch.linkStylePairs[0];
            const idxToks = ((idxNode.children || {}).index || []);
            const indices = idxToks.map(t => parseInt(t.image, 10)).filter(n => Number.isFinite(n));
            // Extract key:value pairs
            const pairs = (pairNode.children || {}).linkStylePair || [];
            const props = {};
            for (const p of pairs) {
                const pch = (p.children || {});
                const keyTok = pch.key?.[0];
                const vTok = (pch.valueColor?.[0] || pch.valueQuoted?.[0] || pch.valueNum?.[0] || pch.valueId?.[0] || pch.valueText?.[0]);
                if (!keyTok || !vTok)
                    continue;
                let val = vTok.image;
                if ((vTok.tokenType?.name === 'QuotedString') && (val.startsWith('"') || val.startsWith("'"))) {
                    val = val.slice(1, -1);
                }
                props[keyTok.image] = val;
            }
            this.pendingLinkStyles.push({ indices, props });
            return;
        }
        // Fallback: legacy token sweep
        const nums = cst.children?.NumberLiteral || [];
        const indices = nums.map(n => parseInt(n.image, 10)).filter(n => Number.isFinite(n));
        const props = this.collectStyleProps(cst);
        this.pendingLinkStyles.push({ indices, props });
    }
    applyLinkStyles() {
        if (!this.pendingLinkStyles.length || !this.edges.length)
            return;
        const normalize = (s) => {
            const out = {};
            for (const [kRaw, vRaw] of Object.entries(s)) {
                const k = kRaw.trim().toLowerCase();
                const v = vRaw.trim();
                if (k === 'stroke')
                    out.stroke = v;
                else if (k === 'stroke-width') {
                    const num = parseFloat(v);
                    if (!Number.isNaN(num))
                        out.strokeWidth = num;
                }
                else if (k === 'opacity' || k === 'stroke-opacity') {
                    const num = parseFloat(v);
                    if (!Number.isNaN(num))
                        out.strokeOpacity = num;
                }
                else if (k === 'stroke-dasharray')
                    out.dasharray = v;
            }
            return out;
        };
        for (const cmd of this.pendingLinkStyles) {
            const style = normalize(cmd.props);
            for (const idx of cmd.indices) {
                if (idx >= 0 && idx < this.edges.length) {
                    const e = this.edges[idx];
                    e.style = { ...(e.style || {}), stroke: style.stroke ?? (e.style?.stroke), strokeWidth: style.strokeWidth ?? (e.style?.strokeWidth), strokeOpacity: style.strokeOpacity ?? (e.style?.strokeOpacity) };
                    if (style.dasharray)
                        e.dasharray = style.dasharray;
                    if (style.animation)
                        e.animation = style.animation;
                }
            }
        }
    }
    computeNodeStyle(nodeId) {
        const out = {};
        const classes = this.nodeClasses.get(nodeId);
        if (classes) {
            for (const c of classes) {
                const s = this.classStyles.get(c);
                if (s)
                    Object.assign(out, this.normalizeStyle(s));
            }
        }
        const direct = this.nodeStyles.get(nodeId);
        if (direct)
            Object.assign(out, this.normalizeStyle(direct));
        return out;
    }
    normalizeStyle(s) {
        const out = {};
        for (const [kRaw, vRaw] of Object.entries(s)) {
            const k = kRaw.trim().toLowerCase();
            const v = vRaw.trim();
            if (k === 'stroke-width') {
                const num = parseFloat(v);
                if (!Number.isNaN(num))
                    out.strokeWidth = num;
            }
            else if (k === 'stroke') {
                out.stroke = v;
            }
            else if (k === 'fill') {
                out.fill = v;
            }
        }
        return out;
    }
}
//# sourceMappingURL=graph-builder.js.map