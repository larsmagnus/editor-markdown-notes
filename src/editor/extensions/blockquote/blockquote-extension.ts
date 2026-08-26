import Blockquote from '@tiptap/extension-blockquote'

import { blockquoteMarkdownSerialize } from '@/editor/extensions/blockquote/blockquote-markdown-spec'
import { createBlockquoteMarkerSyncPlugin } from '@/editor/extensions/blockquote/blockquote-marker-sync-plugin'
import { insertLiteralBlockquoteMarker } from '@/editor/extensions/blockquote/insert-literal-blockquote-marker'

/**
 * The leading `"> "` on a blockquote's own first line becomes real,
 * editable text inside its first paragraph (see `blockquote-marker.ts`),
 * the same "syntax becomes real text" pattern as headings and lists. The
 * wrapping `blockquote` node itself stays untouched structurally - only its
 * `addStorage`/plugin wiring changes here; the stock `Node.create` config
 * (content, input rule, `Mod-Shift-b`/`Backspace` shortcuts) is inherited
 * unchanged via `.extend()`. `BlockquoteMarkerBackspace` (registered
 * separately in `extensions.ts`) is what makes the marker itself safe to
 * backspace into - see its own doc comment for why it stays a separate
 * extension rather than overriding this one's `addKeyboardShortcuts`.
 */
export const BlockquoteExtension = Blockquote.extend({
	addStorage() {
		return {
			markdown: {
				serialize: blockquoteMarkdownSerialize,
				parse: { updateDOM: insertLiteralBlockquoteMarker },
			},
		}
	},

	addProseMirrorPlugins() {
		return [
			...(this.parent?.() ?? []),
			createBlockquoteMarkerSyncPlugin(this.type),
		]
	},
})
