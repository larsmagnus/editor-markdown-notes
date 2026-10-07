import { OrderedList } from '@tiptap/extension-list'

import { orderedListMarkdownSerialize } from '#src/editor/extensions/list/list-wrapper-markdown-spec'

/** Saves each item with the number and delimiter it shows - see `list-wrapper-markdown-spec.ts`. */
export const OrderedListExtension = OrderedList.configure({
	keepMarks: true,
	keepAttributes: false,
}).extend({
	addStorage() {
		return {
			markdown: { serialize: orderedListMarkdownSerialize },
		}
	},
})
