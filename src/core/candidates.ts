import type { FixLevel } from './types.js';
import { validate } from './router.js';
import { fixText } from './fixText.js';

export interface RepairCandidate {
  text: string;
  rule: string;
  issue: string;
  level: FixLevel;
}

interface Rule {
  id: string;
  level: FixLevel;
  /** Applies to the latest chained candidate instead of the source, so rules compose in one candidate. */
  chain?: boolean;
  apply(source: string, diagnostics: string[], level: FixLevel): string;
  issue(diagnostics: string[]): string;
}

const FLOWCHART_HEADER = /^\s*(?:flowchart|graph)\b/;

/** The header may follow `%%` comment lines. */
const SEQUENCE_HEADER_AFTER_COMMENTS = /^\s*(?:\uFEFF)?(?:%%[^\n]*\n\s*)*sequenceDiagram\b/;
const escapeSemicolons = (text: string) => text.replace(/#[a-zA-Z0-9]+;|;/g, token => token === ';' ? '#59;' : token);

function escapeSequenceSemicolons(source: string): string {
  if (!SEQUENCE_HEADER_AFTER_COMMENTS.test(source)) return source;
  const escaped = source.replace(/^(\s*(?:[^\n]*?(?:--?>>|--?>|--?x|--?o)\s*[^:\n]+|Note\s+(?:over|left of|right of)\s+[^:\n]+):)([^\r\n]*)/gim,
    (_, prefix: string, message: string) => prefix + escapeSemicolons(message));
  // Block labels end at the line too; a semicolon would end the statement early.
  return escaped.replace(/^(\s*(?:loop|alt|else|opt|par|and|critical|option|break)\s)([^\r\n]*)/gim,
    (_, prefix: string, label: string) => prefix + escapeSemicolons(label));
}

function moveCheckmarks(source: string): string {
  if (!FLOWCHART_HEADER.test(source)) return source;
  // Only decorated square-label declarations; keep checkmarks as visible text.
  return source.replace(/✅[ \t]+([A-Za-z_][\w-]*)\[([^\]"\n]*)\]/g,
    (_, id: string, label: string) => `${id}["✅ ${label}"]`).replace(/(^[ \t]*|-->[ \t]*)✅[ \t]+([A-Za-z_][\w-]*)(?=[ \t]*(?:-->|$))/gm, '$1$2');
}

/** Sequence words Mermaid reads as keywords when used as an id, in any letter case. */
const SEQ_KEYWORD_IDS = new Set(['loop', 'alt', 'opt', 'par', 'critical', 'break', 'rect', 'end', 'else', 'and', 'box', 'note', 'activate', 'deactivate', 'autonumber', 'participant', 'actor', 'create', 'destroy', 'links', 'link', 'properties', 'details', 'option', 'over']);
const SEQ_ARROW = /(?:<<)?-{1,2}(?:>>|>|x|\))/g;
const SEQ_DECL = /^(\s*(?:create\s+)?(?:participant|actor)\s+)([^\s:]+)(\s+as\s+.*)?$/i;
const SEQ_NOTE = /^(\s*note\s+(?:over|left of|right of)\s+)([^:]*)(:.*)?$/i;
const SEQ_TARGET = /^(\s*(?:activate|deactivate|destroy)\s+)(\w+)(.*)$/i;

const SEQ_META = /^(\s*(?:links?|properties|details)\s+)([^\s:]+)(\s*:.*)$/i;

// A whole id: hyphens belong to ids (Loop-worker is not Loop) unless they start an arrow or follow one as the deactivate marker.
const wordPattern = (word: string) => new RegExp(`(?:(?<![\\w-])|(?<=[>x)]-))${word}(?!\\w)(?!-(?![->x)]))`, 'g');
const arrowEndpoints = (head: string) => head.replace(SEQ_ARROW, ' ').match(/[^\s+-][^\s+]*/g) ?? [];

function uniqueName(source: string, base: string): string {
  let name = base;
  for (let n = 2; wordPattern(name).test(source); n++) name = `${base}${n}`;
  return name;
}

/**
 * Rename sequence ids that collide with a block keyword. The old id stays as the
 * displayed name: "participant <newId> as <old>", declared before first use.
 */
function renameKeywordParticipants(source: string): string {
  if (!SEQUENCE_HEADER_AFTER_COMMENTS.test(source)) return source;
  const lines = source.split('\n');
  const keywords = new Set<string>();
  const hasArrow = (head: string) => new RegExp(SEQ_ARROW.source).test(head);
  for (const line of lines) {
    const decl = line.match(SEQ_DECL);
    const head = line.split(':')[0];
    const ids = decl ? [decl[2]] : hasArrow(head) ? arrowEndpoints(head) : [];
    for (const id of ids) if (SEQ_KEYWORD_IDS.has(id.toLowerCase())) keywords.add(id);
  }
  if (keywords.size === 0) return source;
  const names = new Map([...keywords].map(id => [id, uniqueName(source, `${id}Actor`)]));
  const rename = (text: string) => { for (const [id, name] of names) text = text.replace(wordPattern(id), name); return text; };
  const declared = new Set<string>();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const decl = line.match(SEQ_DECL);
    const note = decl ? null : line.match(SEQ_NOTE);
    const target = decl || note ? null : line.match(SEQ_TARGET);
    const meta = decl || note || target ? null : line.match(SEQ_META);
    const head = line.split(':')[0];
    if (decl) {
      seen.add(decl[2]);
      const name = names.get(decl[2]);
      if (name) {
        declared.add(decl[2]);
        out.push(`${decl[1]}${name}${decl[3] ?? ` as ${decl[2]}`}`);
        continue;
      }
    } else if (note) {
      out.push(`${note[1]}${rename(note[2])}${note[3] ?? ''}`);
      continue;
    } else if (target && names.has(target[2])) {
      out.push(`${target[1]}${names.get(target[2])}${target[3]}`);
      continue;
    } else if (meta && names.has(meta[2])) {
      out.push(`${meta[1]}${names.get(meta[2])}${meta[3]}`);
      continue;
    } else if (!target && !meta && hasArrow(head)) {
      const indent = line.match(/^\s*/)![0];
      const endpoints = arrowEndpoints(head);
      for (const [index, id] of endpoints.entries()) {
        if (!names.has(id) || declared.has(id) || seen.has(id)) continue;
        // Declare earlier unseen endpoints first so participant order does not change.
        for (const earlier of endpoints.slice(0, index)) {
          if (!seen.has(earlier) && !names.has(earlier)) out.push(`${indent}participant ${earlier}`);
          seen.add(earlier);
        }
        out.push(`${indent}participant ${names.get(id)} as ${id}`);
        declared.add(id);
      }
      for (const id of endpoints) seen.add(id);
      out.push(rename(head) + line.slice(head.length));
      continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

/** Flowchart node ids Mermaid rejects; case-sensitive. */
const FLOW_KEYWORD_IDS = new Set(['call', 'end', 'subgraph', 'graph', 'flowchart', 'style', 'class', 'classDef', 'href', 'linkStyle', 'interpolate']);
const FLOW_DIRECTIVES = new Set(['subgraph', 'end', 'graph', 'flowchart', 'style', 'class', 'classDef', 'linkStyle', 'click', 'direction']);
const FLOWCHART_HEADER_AFTER_COMMENTS = /^\s*(?:%%[^\n]*\n\s*)*(?:flowchart|graph)\b/;

/** Same-length copy with label, string and edge-text contents blanked, so only ids stay visible. */
function maskLabels(line: string): string {
  const fill = (m: string) => m[0] + '\0'.repeat(m.length - 2) + m[m.length - 1];
  let out = line.replace(/"[^"]*"/g, m => '\0'.repeat(m.length)).replace(/\|[^|]*\|/g, fill);
  for (let prev = ''; prev !== out;) {
    prev = out;
    out = out.replace(/\[[^[\]]*\]|\([^()]*\)|\{[^{}]*\}/g, fill);
  }
  return out.replace(/(?<![-=.])(?:--|==|-\.)\s+[^\n]*?\s+(?=-->|==>|\.->|---|===)/g, m => m.slice(0, 2) + '\0'.repeat(m.length - 2));
}

interface FlowWord { word: string; index: number; node: boolean; rename: boolean }

function flowWords(line: string): FlowWord[] {
  if (/^\s*(?:%%|classDef\b)/.test(line)) return [];
  const masked = maskLabels(line);
  const lead = masked.match(/^\s*([A-Za-z_]\w*)/)?.[1];
  const tokens = masked.trim().split(/\s+/);
  const words: FlowWord[] = [];
  for (const m of masked.matchAll(/[A-Za-z_]\w*/g)) {
    const before = masked.slice(0, m.index).trimEnd();
    const after = masked.slice(m.index + m[0].length).trimStart();
    const isLead = before === '';
    const opensNode = after === '' || /^(?:[[({&;<\-=~.]|:::|@\{)/.test(after);
    const directive = isLead && FLOW_DIRECTIVES.has(m[0]) && !/^(?:[[({&\-=~.]|:::|@\{)/.test(after);
    const className = before.endsWith(':::') || (lead === 'class' && tokens.length > 2 && m.index! >= masked.lastIndexOf(tokens[tokens.length - 1]));
    const node = !directive && !className && (isLead || /[&>\-=.~|]$/.test(before)) && opensNode;
    words.push({ word: m[0], index: m.index!, node, rename: !directive && !className });
  }
  return words;
}

/**
 * Rename flowchart node ids that are Mermaid keywords. The old id stays as the
 * visible text: it becomes the label when no occurrence carries a shape label.
 */
function renameFlowchartKeywordIds(source: string): string {
  if (!FLOWCHART_HEADER_AFTER_COMMENTS.test(source)) return source;
  const lines = source.split('\n');
  const keywords = new Set<string>();
  for (const line of lines.slice(1)) for (const w of flowWords(line)) if (w.node && FLOW_KEYWORD_IDS.has(w.word)) keywords.add(w.word);
  if (keywords.size === 0) return source;
  const taken = (name: string) => new RegExp(`\\b${name}\\b`).test(source);
  const names = new Map([...keywords].map(id => {
    let name = `${id}Node`;
    for (let n = 2; taken(name); n++) name = `${id}Node${n}`;
    return [id, name];
  }));
  const unlabeled = new Set([...keywords].filter(id => !lines.slice(1).some(line =>
    flowWords(line).some(w => w.word === id && w.node && /^(?:[[({]|@\{)/.test(line.slice(w.index + id.length))))));
  return lines.map((line, i) => {
    if (i === 0) return line;
    let next = line;
    for (const w of flowWords(line).reverse()) {
      const name = names.get(w.word);
      if (!name || !w.rename) continue;
      const label = unlabeled.delete(w.word);
      next = next.slice(0, w.index) + name + (label ? `["${w.word}"]` : '') + next.slice(w.index + w.word.length);
    }
    return next;
  }).join('\n');
}

const RULES: Rule[] = [
  {
    id: 'sequence-semicolon-escape',
    level: 'safe',
    chain: true,
    apply: escapeSequenceSemicolons,
    issue: () => 'unescaped sequence message or note semicolon',
  },
  {
    id: 'sequence-keyword-participant-id',
    level: 'safe',
    chain: true,
    apply: renameKeywordParticipants,
    issue: () => 'id collides with a Mermaid keyword',
  },
  {
    id: 'flowchart-keyword-node-id',
    level: 'safe',
    chain: true,
    apply: renameFlowchartKeywordIds,
    issue: () => 'id collides with a Mermaid keyword',
  },
  {
    id: 'flowchart-checkmark-label',
    level: 'safe',
    apply: moveCheckmarks,
    issue: () => 'checkmark outside flowchart label',
  },
  {
    id: 'maid-fixtext',
    level: 'safe', // runs at the requested level
    apply: (source, diagnostics, level) => diagnostics.length > 0 ? fixText(source, { level }).fixed : source,
    issue: diagnostics => diagnostics[0] ?? 'syntax error',
  },
];

/**
 * Ordered repair candidates for one diagram. Pure and synchronous; a candidate
 * is a guess, never a claim that Mermaid accepts it. The caller must parse it.
 */
export function repairCandidates(source: string, options: { level?: FixLevel } = {}): RepairCandidate[] {
  const level = options.level ?? 'safe';
  const diagnostics = validate(source).errors
    .filter(e => e.severity === 'error')
    .map(e => `L${e.line}:${e.column} ${e.message}`);
  const candidates: RepairCandidate[] = [];
  let chained = source;
  for (const rule of RULES) {
    if (rule.level === 'all' && level === 'safe') continue;
    const input = rule.chain ? chained : source;
    const text = rule.apply(input, diagnostics, level);
    if (text === input) continue;
    if (rule.chain) chained = text;
    if (candidates.some(c => c.text === text)) continue;
    candidates.push({ text, rule: rule.id, issue: rule.issue(diagnostics), level: rule.id === 'maid-fixtext' ? level : rule.level });
  }
  return candidates;
}
