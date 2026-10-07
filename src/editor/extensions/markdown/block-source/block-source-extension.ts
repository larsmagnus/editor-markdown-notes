import { Extension } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { MarkdownIt } from 'markdown-it'

import { installSourceBlockCapture } from '#src/editor/extensions/markdown/block-source/capture-source-blocks'
import { markdownInternals } from '#src/editor/extensions/markdown/block-source/markdown-internals'
import { serializeNote } from '#src/editor/extensions/markdown/block-source/serialize-note'
import { sourceIdAttribute } from '#src/editor/extensions/markdown/block-source/source-id-attribute'
import type { SourceRegistry } from '#src/editor/extensions/markdown/block-source/source-registry'
import { installPluginsOnce } from '#src/editor/extensions/markdown/install-plugins-once'

type BlockSourceStorage = {
	registry: SourceRegistry | null
	/** Each block the author changed, as last synced (`synced-blocks.ts`). */
	synced: WeakMap<ProseMirrorNode, string>
	markdown: { parse: { setup: (md: MarkdownIt) => void } }
}

/**
 * Remembers each top-level block's original text (`parse-note-document.ts`)
 * and saves untouched blocks back exactly as they were read
 * (`serialize-note.ts`).
 *
 * `sourceId` ties a node back to its source block. It is never rendered and
 * never carried onto the second half of a split, so only a block's original
 * node - or an undo's exact rebuild of it - can claim that block's text.
 */
export const BlockSource = Extension.create<object, BlockSourceStorage>({
	name: 'blockSource',
	// Below `tiptap-markdown`'s own 50, so its `onBeforeCreate` has already
	// built the storage this wraps.
	priority: 40,

	addGlobalAttributes() {
		return [sourceIdAttribute()]
	},

	addStorage() {
		return {
			registry: null,
			synced: new WeakMap(),
			markdown: {
				parse: {
					setup(md: MarkdownIt) {
						installSourceBlockCapture(md)
					},
				},
			},
		}
	},

	onBeforeCreate() {
		installPluginsOnce(markdownInternals(this.editor).parser.md)
		const markdown = this.editor.storage.markdown as {
			getMarkdown: () => string
		}
		const serializeWhole = markdown.getMarkdown
		markdown.getMarkdown = () => {
			const { registry } = this.storage
			return registry ? serializeNote(this.editor, registry) : serializeWhole()
		}
	},
})

declare module '@tiptap/core' {
	interface Storage {
		blockSource: BlockSourceStorage
	}
}
