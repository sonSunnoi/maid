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
  apply(source: string, diagnostics: string[], level: FixLevel): string;
  issue(diagnostics: string[]): string;
}

const SEQUENCE_HEADER = /^\s*(?:\uFEFF)?sequenceDiagram\b/;
const FLOWCHART_HEADER = /^\s*(?:flowchart|graph)\b/;

function escapeSequenceSemicolons(source: string): string {
  if (!SEQUENCE_HEADER.test(source)) return source;
  return source.replace(/^(\s*(?:[^\n]*?(?:--?>>|--?>|--?x|--?o)\s*[^:\n]+|Note\s+(?:over|left of|right of)\s+[^:\n]+):)([^\r\n]*)/gim,
    (_, prefix: string, message: string) => prefix + message.replace(/#[a-zA-Z0-9]+;|;/g, token => token === ';' ? '#59;' : token));
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

const wordPattern = (word: string) => new RegExp(`(?<!\\w)${word}(?!\\w)`, 'g');
const arrowEndpoints = (head: string) => head.replace(SEQ_ARROW, ' ').match(/[^\s+\-]+/g) ?? [];

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
  if (!SEQUENCE_HEADER.test(source)) return source;
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
    } else if (!target && hasArrow(head)) {
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

const RULES: Rule[] = [
  {
    id: 'sequence-semicolon-escape',
    level: 'safe',
    apply: escapeSequenceSemicolons,
    issue: () => 'unescaped sequence message or note semicolon',
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
  {
    id: 'sequence-keyword-participant-id',
    level: 'all',
    apply: renameKeywordParticipants,
    issue: () => 'block keyword used as participant id',
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
  for (const rule of RULES) {
    if (rule.level === 'all' && level === 'safe') continue;
    const text = rule.apply(source, diagnostics, level);
    if (text === source || candidates.some(c => c.text === text)) continue;
    candidates.push({ text, rule: rule.id, issue: rule.issue(diagnostics), level: rule.id === 'maid-fixtext' ? level : rule.level });
  }
  return candidates;
}
