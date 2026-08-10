import type { Storage } from '@tiptap/core'
import ItalicMark from '@tiptap/extension-italic'

import { italicMarkdownSpec } from '@/editor/italic-markdown-spec'
import { italicInputRules, italicPasteRules } from '@/editor/italic-rules'
import { DEFAULT_SETTINGS } from '@/shared/messages'

// `addAttributes()`'s `parseHTML` closes over a `storage` snapshot Tiptap
// takes at schema-build time, before that editor's own storage exists - so
// `this.storage` inside `parseHTML` never reflects later mutations to
// `editor.storage.italic.preferredMarkup`. `onBeforeCreate` runs synchronously
// during `new Editor()`, after storage is set up but before any content is
// parsed, so it captures the same live object `editor.storage.italic` is;
// reads through it below stay live because it's the same reference, not a
// copy. (`onCreate` fires too late - it's deferred via `setTimeout`.)
//
// Module-level, so it holds only the most recently constructed editor's
// storage - a second concurrent editor (multiple open panels) would overwrite
// it. `editorMarkdownNotes.italicMarker` is a single global VSCode setting
// broadcast to every panel (see `use-italic-marker.ts`), so every panel's
// `preferredMarkup` converges on the same value; the only exposure is the
// narrow, self-correcting window before a setting change has finished
// broadcasting to all panels.
let liveStorage: Storage['italic'] | null = null

/**
 * Preserves whichever italic marker (`_` or `*`) a file was written with,
 * instead of the default serializer's hardcoded `*`. `markup` is read from
 * `data-markup` (see `italicMarkdownSpec`). Fresh italics (toolbar, bubble
 * menu, Cmd/Ctrl+I) have no source marker, so they use
 * `storage.preferredMarkup` instead, kept live by `editor.tsx` from
 * `editorMarkdownNotes.italicMarker`.
 */
export const ItalicExtension = ItalicMark.extend({
	onBeforeCreate() {
		liveStorage = this.editor.storage.italic
	},
	addAttributes() {
		return {
			markup: {
				default: DEFAULT_SETTINGS.italicMarker,
				parseHTML: (element: HTMLElement) =>
					element.getAttribute('data-markup') ||
					liveStorage?.preferredMarkup ||
					DEFAULT_SETTINGS.italicMarker,
				renderHTML: () => ({}),
				rendered: false,
			},
		}
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
			toggleItalic:
				() =>
				({ commands, editor }) => {
					if (editor.isActive(this.name)) return commands.unsetMark(this.name)
					return commands.setMark(this.name, {
						markup: this.storage.preferredMarkup,
					})
				},
			unsetItalic:
				() =>
				({ commands }) =>
					commands.unsetMark(this.name),
		}
	},
	addInputRules() {
		return italicInputRules(this.type)
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
