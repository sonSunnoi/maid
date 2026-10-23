/**
 * Mermaid.js-compatible API
 *
 * This module provides a drop-in replacement for Mermaid.js's render API,
 * using Maid's built-in renderer instead of the official Mermaid renderer.
 *
 * Usage:
 * ```js
 * import { createMermaidAPI } from '@probelabs/maid';
 *
 * const maid = createMermaidAPI();
 * const { svg } = await maid.render('uniqueId', diagramText);
 * ```
 */
import { renderMermaid } from './renderer/index.js';
/**
 * Creates a Mermaid.js-compatible API instance
 */
export function createMermaidAPI() {
    return {
        initialize(_config) {
            // No-op - Maid renderer doesn't need initialization
        },
        async render(_id, text, options) {
            try {
                const result = renderMermaid(text, options);
                return { svg: result.svg };
            }
            catch (error) {
                throw new Error(`Maid render failed: ${error.message || 'Unknown error'}`);
            }
        },
        renderSync(_id, text, options) {
            try {
                const result = renderMermaid(text, options);
                return { svg: result.svg };
            }
            catch (error) {
                throw new Error(`Maid render failed: ${error.message || 'Unknown error'}`);
            }
        }
    };
}
// Export a default instance for convenience
export const maid = createMermaidAPI();
//# sourceMappingURL=mermaid-compat.js.map