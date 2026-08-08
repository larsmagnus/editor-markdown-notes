import type { ChainedCommands } from '@tiptap/react'

export type ListStyle = 'ordered' | 'unordered'

type ListStyleCommand = {
	apply: (chain: ChainedCommands) => ChainedCommands
	/** The node `editor.isActive` checks. */
	activeName: string
}

export const LIST_STYLE_COMMANDS: Record<ListStyle, ListStyleCommand> = {
	ordered: {
		apply: (chain) => chain.toggleOrderedList(),
		activeName: 'orderedList',
	},
	unordered: {
		apply: (chain) => chain.toggleBulletList(),
		activeName: 'bulletList',
	},
}

export function isListStyle(style: string): style is ListStyle {
	return style in LIST_STYLE_COMMANDS
}
