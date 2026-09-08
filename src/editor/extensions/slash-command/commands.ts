import type { ChainedCommands, Editor, Range } from '@tiptap/core'
import {
	Code2,
	GitBranch,
	Image as ImageIcon,
	ListTodo,
	Sparkles,
	Table2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import {
	fenceText,
	parseFence,
} from '#src/editor/extensions/code-block/code-fence'
import { MERMAID_LANGUAGE } from '#src/editor/extensions/mermaid/language'
import { runAskCommand } from '#src/editor/extensions/slash-command/ask-command'
import { runInsertImageCommand } from '#src/editor/extensions/slash-command/insert-image-command'

export type SlashCommandItem = {
	id: string
	label: string
	/** Extra terms the query can match, beyond the label. */
	keywords: string[]
	icon: LucideIcon
	/** Replaces `range` (the `/query` text) with this action's result. */
	run: (editor: Editor, range: Range) => void
	/**
	 * Needs the extension host (a local `claude` CLI, filesystem access) - not
	 * offered by the standalone web app, where nothing is listening on the
	 * other end of the message it would post. See `extension.ts`'s `filterCommands`.
	 */
	vscodeOnly?: boolean
}

/**
 * Focuses, replaces `range` with nothing, and hands the rest of the chain to
 * `op` - the one step every command but "image" (async, so it removes the
 * range up front and inserts later; see `insert-image-command.ts`) shares.
 */
function runWithRange(
	editor: Editor,
	range: Range,
	op: (chain: ChainedCommands) => ChainedCommands
): void {
	op(editor.chain().focus().deleteRange(range)).run()
}

/**
 * Every action the slash command menu offers.
 *
 * A table rather than one-off wiring in the extension, the same convention
 * `TEXT_STYLE_COMMANDS` uses for the toolbar - a sixth command later means
 * adding one entry here.
 */
export const SLASH_COMMANDS: SlashCommandItem[] = [
	{
		id: 'mermaid',
		label: 'Mermaid diagram',
		keywords: ['diagram', 'chart', 'flowchart', 'graph'],
		icon: GitBranch,
		run: (editor, range) =>
			runWithRange(editor, range, (chain) =>
				chain
					.setCodeBlock()
					// A JSON text node, not a markdown/HTML string: `insertContent`
					// parses a string as HTML by default, which double-escapes `-->`.
					// `language` is no longer a node attribute (see `code-block-extension.ts`),
					// so the fence line carries it as real text instead.
					.insertContent({
						type: 'text',
						text: fenceText('graph TD\n  A --> B', MERMAID_LANGUAGE),
					})
			),
	},
	{
		id: 'code',
		label: 'Code block',
		keywords: ['code', 'snippet', 'fence', 'pre'],
		icon: Code2,
		run: (editor, range) => {
			// A blank line between the fences, not `fenceText('', '')` (which
			// collapses to "```\n```", no gap) - that builder exists to
			// round-trip an already-empty block byte-for-byte, but here the
			// author is about to type, and typing right where the fences touch
			// would run straight into the closing one.
			const text = '```\n\n```'
			runWithRange(editor, range, (chain) =>
				chain
					.setCodeBlock()
					.insertContent({ type: 'text', text })
					// `setCodeBlock` converts the block in place, so `range.from` is
					// already the content's own start position (unlike `button-add.tsx`,
					// which inserts a brand new node and has to add 1 for it) - derived
					// from the fence's own parse rather than hand-counted, which is what
					// let this drift out of sync with the text above once already.
					.setTextSelection(range.from + parseFence(text).codeFrom)
			)
		},
	},
	{
		id: 'task-list',
		label: 'Task list',
		keywords: ['todo', 'checklist', 'checkbox'],
		icon: ListTodo,
		run: (editor, range) =>
			runWithRange(editor, range, (chain) => chain.toggleTaskList()),
	},
	{
		id: 'table',
		label: 'Table',
		keywords: ['grid', 'rows', 'columns'],
		icon: Table2,
		run: (editor, range) =>
			runWithRange(editor, range, (chain) =>
				chain.insertTable({ rows: 2, cols: 2, withHeaderRow: true })
			),
	},
	{
		id: 'image',
		label: 'Image',
		keywords: ['picture', 'photo', 'file'],
		icon: ImageIcon,
		run: runInsertImageCommand,
	},
	{
		id: 'ask',
		label: 'Ask Claude',
		keywords: ['ai', 'claude', 'prompt'],
		icon: Sparkles,
		run: runAskCommand,
		vscodeOnly: true,
	},
]
