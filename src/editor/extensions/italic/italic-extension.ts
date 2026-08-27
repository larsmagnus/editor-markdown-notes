import type { Storage } from '@tiptap/core'
import ItalicMark, {
	starInputRegex,
	underscoreInputRegex,
} from '@tiptap/extension-italic'

import { createDelimitedMarkExtension } from '@/editor/extensions/formatting/delimited-mark-extension'
import { createDelimiterInputRule } from '@/editor/extensions/formatting/delimiter-input-rule'
import { createToggleItalicCommand } from '@/editor/extensions/italic/create-toggle-italic-command'
import { italicDelimiterSpec } from '@/editor/extensions/italic/italic-delimiter-spec'
import { italicMarkdownSpec } from '@/editor/extensions/italic/italic-markdown-spec'
import { italicMarkupAttribute } from '@/editor/extensions/italic/italic-markup-attribute'
import { italicPasteRules } from '@/editor/extensions/italic/italic-rules'
import { DEFAULT_SETTINGS } from '@/shared/messages'

// `parseHTML` closes over a storage snapshot taken at schema-build time,
// before the editor's own storage exists, so `this.storage` there never sees
// later mutations. `onBeforeCreate` runs after storage is set up and before
// content is parsed, capturing the live object (`onCreate` is too late - it is
// deferred via `setTimeout`).
//
// Module-level, so a second concurrent editor overwrites it. `italicMarker` is
// one global setting broadcast to every panel, so they converge; the exposure
// is the self-correcting window while a change is still broadcasting.
let liveStorage: Storage['italic'] | null = null

/**
 * `_italic_`/`*italic*` with real, caret-revealed delimiter text, resolving
 * its own open/close rather than taking a fixed delimiter: which character is
 * CommonMark-valid depends on the intraword rule and on `preferredMarkup`.
 *
 * `markup` is read from `data-markup`. A fresh italic has no source marker, so
 * it uses `preferredMarkup`, kept live from `editorMarkdownNotes.italicMarker`.
 */
export const ItalicExtension = createDelimitedMarkExtension(ItalicMark, {
	ensureSpec: italicDelimiterSpec(),
	// Nests inside bold and strike - see `uniform-outer-marks.ts`.
	outerMarkNames: ['link', 'bold', 'strike'],
}).extend({
	onBeforeCreate() {
		liveStorage = this.editor.storage.italic
	},
	addAttributes() {
		return { markup: italicMarkupAttribute(() => liveStorage) }
	},
	addStorage() {
		return {
			preferredMarkup: DEFAULT_SETTINGS.italicMarker,
			markdown: italicMarkdownSpec(),
		}
	},
	addCommands() {
		return {
			setItalic:
				() =>
				({ commands }) =>
					commands.setMark(this.name, {
						markup: this.storage.preferredMarkup,
					}),
			toggleItalic: () =>
				createToggleItalicCommand(
					this.type,
					this.name,
					() => this.storage.preferredMarkup
				),
			unsetItalic:
				() =>
				({ commands }) =>
					commands.unsetMark(this.name),
		}
	},
	addInputRules() {
		return [
			createDelimiterInputRule(this.type, starInputRegex, () => ({
				markup: '*',
			})),
			createDelimiterInputRule(this.type, underscoreInputRegex, () => ({
				markup: '_',
			})),
		]
	},
	addPasteRules() {
		return italicPasteRules(this.type)
	},
})

declare module '@tiptap/core' {
	interface Storage {
		italic: {
			preferredMarkup: string
			markdown: ReturnType<typeof italicMarkdownSpec>
		}
	}
}
