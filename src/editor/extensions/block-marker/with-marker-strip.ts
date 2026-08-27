import type { CommandProps } from '@tiptap/core'

import { STRIP_BLOCK_MARKERS } from '@/editor/extensions/block-marker/strip-marker-plugin'

/**
 * Runs a construct's stock toggle and, when that toggle turned the construct
 * *off*, flags the transaction so `strip-marker-plugin.ts` removes the marker
 * text left behind. Wrapping the command rather than the toolbar means every
 * route into it - toolbar, slash command, keyboard shortcut - is covered by
 * the one override.
 */
export function withMarkerStrip(
	{ editor, tr }: Pick<CommandProps, 'editor' | 'tr'>,
	nodeName: string,
	toggle: () => boolean
): boolean {
	const wasActive = editor.isActive(nodeName)
	const ran = toggle()
	if (ran && wasActive) tr.setMeta(STRIP_BLOCK_MARKERS, true)
	return ran
}
