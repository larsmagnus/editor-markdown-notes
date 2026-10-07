import type { CommandProps } from '@tiptap/core'
import TaskList from '@tiptap/extension-task-list'

import { withMarkerStrip } from '#src/editor/extensions/block-marker/with-marker-strip'
import { bulletListMarkdownSerialize } from '#src/editor/extensions/list/list-wrapper-markdown-spec'

/**
 * `tiptap-markdown` only adds its `tight` attribute to bulletList and
 * orderedList, so task lists would otherwise serialize with a blank line
 * between every item. Saves each item with the bullet it shows - see
 * `list-wrapper-markdown-spec.ts`.
 */
export const TaskListExtension = TaskList.extend({
	addAttributes: () => ({ tight: { default: true, rendered: false } }),
	addCommands() {
		const parent = this.parent?.()

		return {
			...parent,
			toggleTaskList: () => (props: CommandProps) =>
				withMarkerStrip(props, { toggled: this.name, marker: 'taskItem' }, () =>
					Boolean(parent?.toggleTaskList?.()(props))
				),
		}
	},
	addStorage() {
		return {
			markdown: { serialize: bulletListMarkdownSerialize },
		}
	},
})
