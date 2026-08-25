import { InputRule } from '@tiptap/core'
import TaskItem from '@tiptap/extension-task-item'
import { ReactNodeViewRenderer } from '@tiptap/react'

import { insertLiteralTaskMarkers } from '@/editor/extensions/list/insert-literal-list-markers'
import { taskItemMarkdownSerialize } from '@/editor/extensions/list/list-markdown-spec'
import { createSyncTaskCheckedPlugin } from '@/editor/extensions/task-item/sync-task-checked-plugin'
import { TaskItemView } from '@/editor/extensions/task-item/task-item-view'

// Unlike `@tiptap/extension-list`'s own `inputRegex` this mirrors, the
// leading bullet is part of the match, not assumed already gone - see below.
const taskItemInputRegex = /^([-+*]) \[([ |x])?\] $/

/**
 * `TaskItem` with its checkbox drawn as the shadcn `Checkbox`, and an input
 * rule that also converts an already-typed bullet into a task item.
 *
 * The stock rule wraps the current textblock in place, which fails once `- `
 * has already made it a `bulletList` item (bulletList only allows more
 * `listItem`s) - so typing `- [ ] ` normally leaves `[ ] ` as literal text.
 * `toggleTaskList()`, used by the slash command too, lifts the item out and
 * rewraps it correctly instead.
 *
 * The regex's own leading `- ` matters for a second reason past the type
 * mismatch: that bullet is real marker text now (see `list-marker.ts`), not
 * already-consumed markup, so by the time `[ ] ` finishes typing the
 * paragraph reads `- [ ] `, not `[ ] ` alone - an input rule's `find` always
 * matches from the start of the block's accumulated text, so leaving the
 * bullet out of the pattern would simply never match. `deleteRange` removes
 * the whole matched span, bullet included; `list-marker-sync-plugin.ts`'s
 * safety net is what puts a real `- [ ] ` back once `toggleTaskList` has
 * made the type change, from the `checked` attribute just set below.
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
