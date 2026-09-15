import { Extension } from '@tiptap/core'

import { endBlankListItem } from '#src/editor/extensions/list/end-blank-list-item'
import { splitAfterMarker } from '#src/editor/extensions/list/split-after-marker'

/**
 * Blank list items end on Enter, not split. The marker is real text in this
 * schema, so the default `splitListItem` would loop, creating blank items
 * endlessly.
 */
export const ListEnter = Extension.create({
	name: 'listEnter',

	addKeyboardShortcuts() {
		return {
			Enter: () =>
				endBlankListItem(this.editor) || splitAfterMarker(this.editor),
		}
	},
})
