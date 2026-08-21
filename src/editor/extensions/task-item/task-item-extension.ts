import { InputRule } from '@tiptap/core'
import TaskItem from '@tiptap/extension-task-item'
import { ReactNodeViewRenderer } from '@tiptap/react'

import { TaskItemView } from '@/editor/extensions/task-item/task-item-view'

// Mirrors `@tiptap/extension-list`'s `inputRegex`, not re-exported from
// `@tiptap/extension-task-item` (and only a transitive dependency here).
const taskItemInputRegex = /^\s*(\[([ |x])?\])\s$/

/**
 * `TaskItem` with its checkbox drawn as the shadcn `Checkbox`, and an input
 * rule that also converts an already-typed bullet into a task item.
 *
 * The stock rule wraps the current textblock in place, which fails once `- `
 * has already made it a `bulletList` item (bulletList only allows more
 * `listItem`s) - so typing `- [ ] ` normally leaves `[ ] ` as literal text.
 * `toggleTaskList()`, used by the slash command too, lifts the item out and
 * rewraps it correctly instead.
 */
export const TaskItemExtension = TaskItem.configure({ nested: true }).extend({
	addNodeView() {
		return ReactNodeViewRenderer(TaskItemView)
	},
	addInputRules() {
		return [
			new InputRule({
				find: taskItemInputRegex,
				handler: ({ chain, range, match }) => {
					if (this.editor.isActive(this.name)) {
						return null
					}

					chain()
						.deleteRange(range)
						.toggleTaskList()
						.updateAttributes(this.name, { checked: match[2] === 'x' })
						.run()
				},
			}),
		]
	},
})
