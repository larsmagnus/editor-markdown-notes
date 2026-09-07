import { Extension } from '@tiptap/core'

import { endBlankListItem } from '@/editor/extensions/list/end-blank-list-item'

/**
 * Enter on a list item holding nothing but its marker ends that item instead of
 * splitting it. Stock `splitListItem` bails on an empty item and lets the base
 * keymap lift it, but no item here is ever empty - its marker is real text - so
 * without this every Enter on a blank item seeds another blank item, forever.
 */
export const ListEnter = Extension.create({
	name: 'listEnter',

	addKeyboardShortcuts() {
		return {
			Enter: () => endBlankListItem(this.editor),
		}
	},
})
