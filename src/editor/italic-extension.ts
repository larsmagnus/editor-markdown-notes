import ItalicMark, {
	starInputRegex,
	starPasteRegex,
	underscoreInputRegex,
	underscorePasteRegex,
} from '@tiptap/extension-italic'
import { markInputRule, markPasteRule } from '@tiptap/react'
import type { MarkdownSerializerState } from 'prosemirror-markdown'
import type { Mark, Node as ProseMirrorNode } from 'prosemirror-model'

import { italicMarkup } from '@/editor/italic-markup'
import type { MarkdownIt } from '@/editor/markdown-it-types'
import { DEFAULT_SETTINGS } from '@/shared/messages'

/**
 * Preserves whichever italic marker (`_` or `*`) a file was written with,
 * instead of the default serializer's hardcoded `*`. `markup` is read from
 * `data-markup`, which the `em_open` patch below stamps onto markdown-it's
 * output since the marker is otherwise lost before ProseMirror sees it.
 * Fresh italics (toolbar, bubble menu, Cmd/Ctrl+I) have no source marker, so
 * they use `storage.preferredMarkup` instead, kept live by `editor.tsx` from
 * `editorMarkdownNotes.italicMarker`.
 */
export const ItalicExtension = ItalicMark.extend({
	addAttributes() {
		return {
			markup: {
				default: DEFAULT_SETTINGS.italicMarker,
				parseHTML: (element: HTMLElement) =>
					element.getAttribute('data-markup') || undefined,
				renderHTML: () => ({}),
				rendered: false,
			},
		}
	},
	addStorage() {
		return {
			preferredMarkup: DEFAULT_SETTINGS.italicMarker,
			markdown: {
				serialize: {
					open: (
						_state: MarkdownSerializerState,
						mark: Mark,
						parent: ProseMirrorNode,
						index: number
					) => italicMarkup(mark, parent, index, 'open'),
					close: (
						_state: MarkdownSerializerState,
						mark: Mark,
						parent: ProseMirrorNode,
						index: number
					) => italicMarkup(mark, parent, index, 'close'),
					mixable: true,
					// No `expelEnclosingWhitespace`: tiptap-markdown assumes
					// `open`/`close` are plain strings when it's set, and mishandles
					// function delimiters like ours (reads `.length` as arity,
					// concatenates `.toString()`), corrupting output.
				},
				parse: {
					setup(markdownit: MarkdownIt) {
						markdownit.renderer.rules.em_open = (tokens, idx) =>
							`<em data-markup="${tokens[idx].markup === '*' ? '*' : '_'}">`
					},
				},
			},
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
				({ commands }) =>
					commands.toggleMark(this.name, {
						markup: this.storage.preferredMarkup,
					}),
			unsetItalic:
				() =>
				({ commands }) =>
					commands.unsetMark(this.name),
		}
	},
	addInputRules() {
		return [
			markInputRule({
				find: starInputRegex,
				type: this.type,
				getAttributes: () => ({ markup: '*' }),
			}),
			markInputRule({
				find: underscoreInputRegex,
				type: this.type,
				getAttributes: () => ({ markup: '_' }),
			}),
		]
	},
	addPasteRules() {
		return [
			markPasteRule({
				find: starPasteRegex,
				type: this.type,
				getAttributes: () => ({ markup: '*' }),
			}),
			markPasteRule({
				find: underscorePasteRegex,
				type: this.type,
				getAttributes: () => ({ markup: '_' }),
			}),
		]
	},
})
