import type { CommandProps } from '@tiptap/core'

import { STRIP_BLOCK_MARKERS } from '#src/editor/extensions/block-marker/strip-marker-plugin'

/** Which node the toggle acts on, and which one holds the marker text. */
type MarkerStripNodes = {
	/** The node whose presence means the toggle is turning the construct off. */
	toggled: string
	/** The node type whose marker `strip-marker-plugin.ts` should remove. */
	marker: string
}

/**
 * Runs a construct's stock toggle and, when that toggle turned the construct
 * *off*, names the marker to remove on the transaction so
 * `strip-marker-plugin.ts` removes the text left behind. Wrapping the command
 * rather than the toolbar means every route into it - toolbar, slash command,
 * keyboard shortcut - is covered by the one override.
 *
 * The two node names differ for lists, and load-bearingly so: activity is asked
 * of the *list* (`bulletList`), because switching a bullet list to an ordered
 * one leaves every item still an item and must strip nothing, while the marker
 * belongs to the `listItem`.
 */
export function withMarkerStrip(
	{ editor, tr }: Pick<CommandProps, 'editor' | 'tr'>,
	nodes: MarkerStripNodes,
	toggle: () => boolean
): boolean {
	const wasActive = editor.isActive(nodes.toggled)
	const ran = toggle()
	if (ran && wasActive) tr.setMeta(STRIP_BLOCK_MARKERS, nodes.marker)
	return ran
}
