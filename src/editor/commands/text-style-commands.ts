import type { ChainedCommands } from '@tiptap/react'

export type TextStyle =
	| 'italic'
	| 'bold'
	| 'strike'
	| 'code'
	| 'codeBlock'
	| 'blockquote'
	| 'paragraph'
	| 'none'

type TextStyleCommand = {
	/** Applies the style to an already-focused chain. */
	apply: (chain: ChainedCommands) => ChainedCommands
	/** The mark or node `editor.isActive` checks, or null if the style is a reset. */
	activeName: string | null
	/**
	 * Whether `editor.can()` gives a meaningful answer. The styles marked false
	 * always apply, and asking about them used to fall off the end of a switch and
	 * return `undefined` - which read as "cannot", leaving both buttons in the
	 * menu bar permanently disabled.
	 */
	queryable: boolean
}

/**
 * Every text style, and the three things the editor needs to know about each.
 *
 * A table rather than parallel switch statements: apply, is-active and can-apply
 * used to be three separate dispatches that had to be kept in step by hand, and
 * the one that drifted asked its question by performing the toggle.
 */
export const TEXT_STYLE_COMMANDS: Record<TextStyle, TextStyleCommand> = {
	bold: {
		apply: (chain) => chain.toggleBold(),
		activeName: 'bold',
		queryable: true,
	},
	italic: {
		apply: (chain) => chain.toggleItalic(),
		activeName: 'italic',
		queryable: true,
	},
	strike: {
		apply: (chain) => chain.toggleStrike(),
		activeName: 'strike',
		queryable: true,
	},
	code: {
		apply: (chain) => chain.toggleCode(),
		activeName: 'code',
		queryable: true,
	},
	codeBlock: {
		apply: (chain) => chain.toggleCodeBlock(),
		activeName: 'codeBlock',
		queryable: false,
	},
	blockquote: {
		apply: (chain) => chain.toggleBlockquote(),
		activeName: 'blockquote',
		queryable: true,
	},
	paragraph: {
		apply: (chain) => chain.setParagraph(),
		activeName: 'paragraph',
		queryable: false,
	},
	none: {
		// Colours, then marks, then the heading level.
		apply: (chain) => chain.unsetColor().unsetAllMarks().setParagraph(),
		activeName: null,
		queryable: false,
	},
}
