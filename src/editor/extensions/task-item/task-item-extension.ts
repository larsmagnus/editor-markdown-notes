import { InputRule } from '@tiptap/core'
import TaskItem from '@tiptap/extension-task-item'
import { ReactNodeViewRenderer } from '@tiptap/react'

import { insertLiteralTaskMarkers } from '@/editor/extensions/list/insert-literal-list-markers'
import { taskItemMarkdownSerialize } from '@/editor/extensions/list/list-markdown-spec'
import { createSyncTaskCheckedPlugin } from '@/editor/extensions/task-item/sync-task-checked-plugin'
import { TaskItemView } from '@/editor/extensions/task-item/task-item-view'

// Unlike the stock `inputRegex` this mirrors, the leading bullet is part of
// the match rather than assumed already consumed.
const taskItemInputRegex = /^([-+*]) \[([ |x])?\] $/

/**
 * `TaskItem` with its checkbox drawn as the shadcn `Checkbox`, and an input
 * rule that converts an already-typed bullet into a task item.
 *
 * The stock rule wraps the current textblock in place, which fails once `- `
 * has made it a `bulletList` item, leaving `[ ] ` as literal text.
 * `toggleTaskList()` lifts the item out and rewraps it instead.
 *
 * The bullet belongs in the regex because it is real marker text, not
 * consumed markup: by the time `[ ] ` finishes typing the paragraph reads
 * `- [ ] `, and an input rule matches from the start of that text. The marker
 * sync plugin puts a canonical `- [ ] ` back from the `checked` attribute.
 */
export const TaskItemExtension = TaskItem.configure({ nested: true }).extend({
	addNodeView() {
		return ReactNodeViewRenderer(TaskItemView)
	},
	addStorage() {
		return {
			markdown: {
				serialize: taskItemMarkdownSerialize,
				parse: { updateDOM: insertLiteralTaskMarkers },
			},
		}
	},
	addProseMirrorPlugins() {
		return [
			...(this.parent?.() ?? []),
			createSyncTaskCheckedPlugin(this.editor.schema),
		]
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
						.updateAttributes(this.name, {
							checked: match[2]?.toLowerCase() === 'x',
						})
						.run()
				},
			}),
		]
	},
})
