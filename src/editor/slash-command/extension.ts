import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'

import { SLASH_COMMANDS } from '@/editor/slash-command/commands'
import type { SlashCommandItem } from '@/editor/slash-command/commands'
import { createSlashCommandRender } from '@/editor/slash-command/render'

function filterCommands(query: string): SlashCommandItem[] {
	const search = query.toLowerCase()

	return SLASH_COMMANDS.filter(
		(item) =>
			item.label.toLowerCase().includes(search) ||
			item.keywords.some((keyword) => keyword.includes(search))
	)
}

/**
 * Opens a filterable menu of editor actions when `/` is typed at the start of
 * an empty line - mermaid diagrams, code blocks, task lists, tables, and
 * images, listed in `commands.ts`. Modeled on TipTap's own slash-command
 * example; `render.ts` carries the menu's mount/position lifecycle.
 *
 * Contributes a `Suggestion` plugin only, no schema node, so where this sits
 * in `extensions.ts` doesn't matter.
 */
export const SlashCommand = Extension.create({
	name: 'slashCommand',

	addProseMirrorPlugins() {
		return [
			Suggestion<SlashCommandItem>({
				editor: this.editor,
				char: '/',
				startOfLine: true,
				items: ({ query }) => filterCommands(query),
				command: ({ editor, range, props }) => props.run(editor, range),
				render: createSlashCommandRender,
			}),
		]
	},
})
