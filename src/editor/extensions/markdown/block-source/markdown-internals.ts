import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { MarkdownIt } from 'markdown-it'

type MarkdownInternals = {
	parser: { md: MarkdownIt; parse: (content: string) => string }
	serializer: { serialize: (doc: ProseMirrorNode) => string }
}

/**
 * The parser and serializer `tiptap-markdown` keeps on `editor.storage`,
 * which its published `MarkdownStorage` type leaves out - they are set in its
 * `onBeforeCreate`, so they exist on every editor this app builds.
 */
export function markdownInternals(editor: Editor): MarkdownInternals {
	const storage: unknown = editor.storage.markdown
	return storage as MarkdownInternals
}
