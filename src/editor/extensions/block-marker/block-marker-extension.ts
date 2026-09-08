import { Extension } from '@tiptap/react'

import { createMarkerSyncPlugin } from '#src/editor/extensions/block-marker/create-marker-sync-plugin'
import { createPasteLiteralMarkersPlugin } from '#src/editor/extensions/block-marker/paste-literal-markers'
import { BLOCK_MARKER_SPECS } from '#src/editor/extensions/block-marker/specs'
import { createStripMarkerPlugin } from '#src/editor/extensions/block-marker/strip-marker-plugin'

/**
 * Every block construct's marker upkeep, registered once rather than per node
 * extension: one document walk repairs all of them, and neither the strip pass
 * (keyed off transaction meta) nor the paste pass belongs to any one construct.
 */
export const BlockMarkers = Extension.create({
	name: 'blockMarkers',

	addProseMirrorPlugins() {
		return [
			createMarkerSyncPlugin(BLOCK_MARKER_SPECS),
			createStripMarkerPlugin(),
			createPasteLiteralMarkersPlugin(),
		]
	},
})
