import Paragraph from '@tiptap/extension-paragraph'

import { paragraphMarkdownSerialize } from '#src/editor/extensions/paragraph-markdown-spec'

/**
 * Overrides the stock serializer so consecutive blank lines the author typed
 * at the top level survive a sync - see `paragraph-markdown-spec.ts`. Parsing
 * is untouched: a `<p>` reaches the schema's `paragraph` node the same way
 * regardless of how it serializes back out.
 */
export const ParagraphExtension = Paragraph.extend({
	addStorage() {
		return {
			markdown: {
				serialize: paragraphMarkdownSerialize,
			},
		}
	},
})
