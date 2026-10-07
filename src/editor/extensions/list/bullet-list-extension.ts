import { BulletList } from '@tiptap/extension-list'

import { bulletListMarkdownSerialize } from '#src/editor/extensions/list/list-wrapper-markdown-spec'

/** Saves each item with the bullet it shows - see `list-wrapper-markdown-spec.ts`. */
export const BulletListExtension = BulletList.configure({
	keepMarks: true,
	keepAttributes: false,
}).extend({
	addStorage() {
		return {
			markdown: { serialize: bulletListMarkdownSerialize },
		}
	},
})
