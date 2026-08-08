import ItalicMark from '@tiptap/extension-italic'

import { italicMarkdownSpec } from '@/editor/italic-markdown-spec'
import { italicInputRules, italicPasteRules } from '@/editor/italic-rules'
import { DEFAULT_SETTINGS } from '@/shared/messages'

/**
 * Preserves whichever italic marker (`_` or `*`) a file was written with,
 * instead of the default serializer's hardcoded `*`. `markup` is read from
 * `data-markup` (see `italicMarkdownSpec`). Fresh italics (toolbar, bubble
 * menu, Cmd/Ctrl+I) have no source marker, so they use
 * `storage.preferredMarkup` instead, kept live by `editor.tsx` from
 * `editorMarkdownNotes.italicMarker`.
 */
export const ItalicExtension = ItalicMark.extend({
	addAttributes() {
		return {
			markup: {
				default: DEFAULT_SETTINGS.italicMarker,
				parseHTML: (element: HTMLElement) =>
					element.getAttribute('data-markup') || this.storage.preferredMarkup,
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
