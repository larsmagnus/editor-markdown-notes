import type { ChainedCommands, Editor, Range } from '@tiptap/core'
import {
	Code2,
	GitBranch,
	Image as ImageIcon,
	List,
	ListOrdered,
	ListTodo,
	Sparkles,
	Table2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { ADMONITIONS } from '#src/editor/extensions/admonition/admonition-types'
import {
	fenceText,
	parseFence,
} from '#src/editor/extensions/code-block/code-fence'
import { MERMAID_LANGUAGE } from '#src/editor/extensions/mermaid/language'
import { runAskCommand } from '#src/editor/extensions/slash-command/ask-command'
import { runInsertImageCommand } from '#src/editor/extensions/slash-command/insert-image-command'
import { ADMONITION_TYPES, admonitionTagText } from '#src/lib/admonition-tag'
import type { AdmonitionType } from '#src/lib/admonition-tag'

type RawInsertion = {
	text: string
	/** Caret position within `text`; defaults to end when omitted. */
	caretOffset?: number
}

export type SlashCommandItem = {
	id: string
	label: string
	/** Extra terms the query can match, beyond the label. */
	keywords: string[]
	icon: LucideIcon
	/** Replaces `range` (the `/query` text) with this action's result. */
	run: (editor: Editor, range: Range) => void
	/**
	 * The same action as markdown source, for the raw editor, which has no
	 * ProseMirror chain to run. Absent for commands that need a UI flow of
	 * their own (image picker, Claude prompt), which the raw menu leaves out.
	 */
	raw?: RawInsertion
	/**
	 * Needs the extension host (a local `claude` CLI, filesystem access) - not
	 * offered by the standalone web app, where nothing is listening on the
	 * other end of the message it would post. See `extension.ts`'s `filterCommands`.
	 */
	vscodeOnly?: boolean
}

const MERMAID_SAMPLE = 'graph TD\n  A --> B'

/**
 * A blank line between the fences, not `fenceText('', '')` (which collapses to
 * "```\n```", no gap) - that builder exists to round-trip an already-empty
 * block byte-for-byte, but here the author is about to type, and typing right
 * where the fences touch would run straight into the closing one.
 */
const EMPTY_CODE_BLOCK = '```\n\n```'

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
 * Turns the current block into a code block holding `text`, which carries its
 * own fences. `caretOffset` lands the caret inside them.
 */
function fencedBlockCommand(
	text: string,
	caretOffset?: number
): Pick<SlashCommandItem, 'run' | 'raw'> {
	return {
		raw: { text, caretOffset },
		run: (editor, range) =>
			runWithRange(editor, range, (chain) => {
				// A JSON text node, not a markdown/HTML string: `insertContent`
				// parses a string as HTML by default, which double-escapes `-->`.
				// `language` is no longer a node attribute (see `code-block-extension.ts`),
				// so the fence line carries it as real text instead.
				const filled = chain
					.setCodeBlock()
					.insertContent({ type: 'text', text })
				// `setCodeBlock` converts the block in place, so `range.from` is
				// already the content's own start position (unlike `button-add.tsx`,
				// which inserts a brand new node and has to add 1 for it).
				return caretOffset === undefined
					? filled
					: filled.setTextSelection(range.from + caretOffset)
			}),
	}
}

/** A list kind: `marker` is its raw prefix, `toggle` its live-editor chain step. */
function listCommand(
	marker: string,
	toggle: (chain: ChainedCommands) => ChainedCommands
): Pick<SlashCommandItem, 'run' | 'raw'> {
	return {
		raw: { text: marker },
		run: (editor, range) => runWithRange(editor, range, toggle),
	}
}

/** One entry per GFM alert kind, each opening a quote already tagged and ready for its body. */
function admonitionCommand(type: AdmonitionType): SlashCommandItem {
	const { label, icon } = ADMONITIONS[type]
	return {
		id: type,
		label,
		keywords: ['admonition', 'callout', 'alert', 'quote'],
		icon,
		raw: { text: `> ${admonitionTagText(type)}\n> ` },
		run: (editor, range) =>
			runWithRange(editor, range, (chain) =>
				chain
					.setBlockquote()
					.insertContent({
						type: 'text',
						text: `> ${admonitionTagText(type)}`,
					})
					.splitBlock()
			),
	}
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
		...fencedBlockCommand(fenceText(MERMAID_SAMPLE, MERMAID_LANGUAGE)),
	},
	{
		id: 'code',
		label: 'Code block',
		keywords: ['code', 'snippet', 'fence', 'pre'],
		icon: Code2,
		...fencedBlockCommand(
			EMPTY_CODE_BLOCK,
			parseFence(EMPTY_CODE_BLOCK).codeFrom
		),
	},
	{
		id: 'bullet-list',
		label: 'Bullet list',
		keywords: ['unordered', 'ul', 'bullets'],
		icon: List,
		...listCommand('- ', (chain) => chain.toggleBulletList()),
	},
	{
		id: 'numbered-list',
		label: 'Numbered list',
		keywords: ['ordered', 'ol', 'numbers'],
		icon: ListOrdered,
		...listCommand('1. ', (chain) => chain.toggleOrderedList()),
	},
	{
		id: 'task-list',
		label: 'Task list',
		keywords: ['todo', 'checklist', 'checkbox'],
		icon: ListTodo,
		...listCommand('- [ ] ', (chain) => chain.toggleTaskList()),
	},
	...ADMONITION_TYPES.map(admonitionCommand),
	{
		id: 'table',
		label: 'Table',
		keywords: ['grid', 'rows', 'columns'],
		icon: Table2,
		// Caret in the first header cell, after `| `.
		raw: { text: '|  |  |\n| --- | --- |\n|  |  |', caretOffset: 2 },
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
