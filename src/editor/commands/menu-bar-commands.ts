import type { ChainedCommands } from '@tiptap/react'

/**
 * The menu bar's one-shot commands - the ones with no active or disabled state
 * to track, which is why they are not `ButtonStyle`s.
 */
export const MENU_BAR_COMMANDS: {
	label: string
	apply: (chain: ChainedCommands) => ChainedCommands
}[] = [
	{ label: 'Clear marks', apply: (chain) => chain.unsetAllMarks() },
	{ label: 'Clear nodes', apply: (chain) => chain.clearNodes() },
	{ label: 'Horizontal rule', apply: (chain) => chain.setHorizontalRule() },
	{ label: 'Hard break', apply: (chain) => chain.setHardBreak() },
]
