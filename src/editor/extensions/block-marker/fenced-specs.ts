import { createFenceMarkerSpec } from '@/editor/extensions/block-marker/fence-spec'
import { parseFence } from '@/editor/extensions/code-block/code-fence'
import { parseFrontmatterFence } from '@/editor/extensions/frontmatter/frontmatter-fence'

/**
 * A code block's fence lines. The language tag lives on the opening one, which
 * is why it resolves to whatever is already there rather than being rebuilt.
 */
export const codeBlockMarkerSpec = createFenceMarkerSpec({
	nodeTypes: ['codeBlock'],
	parse: parseFence,
	fenceChar: '`',
	seed: true,
})

/**
 * Frontmatter's `---` lines, for the reveal and for the author deleting one.
 * Nothing seeds them: `detect.ts` only ever builds the node with both already
 * in it.
 */
export const frontmatterMarkerSpec = createFenceMarkerSpec({
	nodeTypes: ['frontmatter'],
	parse: parseFrontmatterFence,
	fenceChar: '-',
	seed: false,
})
