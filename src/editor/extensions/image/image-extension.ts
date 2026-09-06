import Image from '@tiptap/extension-image'
import type { Command } from '@tiptap/pm/state'
import { mergeAttributes, ReactNodeViewRenderer } from '@tiptap/react'

import { ImageView } from '@/editor/extensions/image/image-view'
import {
	createImageStepOverPlugin,
	moveToAdjacentImage,
} from '@/editor/extensions/image/keyboard-nav'
import { createImageSourcePlugin } from '@/editor/extensions/image/sync-image-source-plugin'
import { resolveImageSrc } from '@/lib/host/resolve-image-src'

/**
 * Inline, so an image can sit mid-paragraph, in a link, or in a table cell -
 * all three depend on it. The toolbar overlay (`ImageView`) still draws
 * pan/zoom controls in real `<div>`s, but only inside the live node view's
 * own React tree, built through direct DOM calls like the rest of
 * ProseMirror's rendering - never through HTML-string parsing, which is the
 * only place nested block markup inside inline content would actually be
 * rewritten. The schema's own `renderHTML` below stays a plain `<img>`, so
 * `getHTML()`/copy-paste never see the overlay markup either. `atom` is not
 * the default: without it a click places a text cursor beside the image
 * rather than producing the `NodeSelection` its controls key off.
 */
export const ImageExtension = Image.configure({ inline: true }).extend({
	atom: true,
	// Display only - `src` keeps the author's path, so saving never rewrites
	// the file with vscode-resource URIs.
	renderHTML({ HTMLAttributes }) {
		return [
			'img',
			mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
				src: resolveImageSrc(
					String(HTMLAttributes.src ?? ''),
					window.imageBaseUris
				),
			}),
		]
	},
	// `renderHTML` above still drives `getHTML()` and copy-paste HTML; this
	// takes over only the live editor, where the source reveals as text.
	addNodeView() {
		return ReactNodeViewRenderer(ImageView)
	},
	// `Tab` jumps between images the way it jumps between form fields.
	// Declining hands the key back, so the last image leads out of the
	// editor rather than trapping focus. Plain arrow keys past the image
	// itself go through `createImageStepOverPlugin` (below), not this
	// keymap - see its own doc comment for why a keymap command isn't
	// enough. `image-view.tsx`'s `useImageCaretAdjacent` is what reveals
	// the toolbar as the caret passes, without ever turning that pass into
	// a `NodeSelection` a hard focus would need Tab to leave. A selected
	// image's own Backspace falls through to ProseMirror's default node
	// deletion.
	addKeyboardShortcuts() {
		const run = (command: Command) => () =>
			command(this.editor.state, this.editor.view.dispatch, this.editor.view)

		return {
			Tab: run(moveToAdjacentImage(1)),
			'Shift-Tab': run(moveToAdjacentImage(-1)),
		}
	},
	addProseMirrorPlugins() {
		return [
			...(this.parent?.() ?? []),
			createImageStepOverPlugin(),
			createImageSourcePlugin(),
		]
	},
})
