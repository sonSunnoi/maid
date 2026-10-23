export interface Frontmatter {
    raw: string;
    body: string;
    bodyStartLine: number;
    config?: Record<string, any>;
    themeVariables?: Record<string, string>;
}
export declare function parseFrontmatter(input: string): Frontmatter | null;
//# sourceMappingURL=frontmatter.d.ts.map