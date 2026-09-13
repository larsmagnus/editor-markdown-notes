import type { Editor } from '@tiptap/react'
import { useEffect, useRef } from 'react'

import { frontmatterFenceText } from '#src/editor/extensions/frontmatter/frontmatter-fence'
import { restoreMdxBlocksInTransaction } from '#src/editor/extensions/mdx-block/restore-mdx-blocks'
import { prepareParseableContent } from '#src/hooks/prepare-parseable-content'
import type { FileKind } from '#src/lib/file-kind'

/** Stable, so the default does not re-run the effect on every render. */
const neverOwnSync = () => false

/**
 * Marks the transaction below as a sync rather than an edit.
 *
 * `setContent` emits `update` like any other change, so without this the
 * autosync cannot tell the host's own text from something the author typed,
 * and writes an external edit back as the editor's re-serialization of it -
 * escaping whatever the round-trip does not support, over a file nobody
 * touched. Read by `useMarkdownAutosync`.
 */
export const CONTENT_SYNC_META = 'contentSync'

/**
 * Rebuilds the document whenever the incoming file changes underneath it.
 *
 * Frontmatter is a real node inside the doc, so `editor.storage.markdown.
 * getMarkdown()` already reproduces the `---` fences - comparing it to the
 * whole incoming `content` is what lets this skip a rebuild when nothing
 * actually changed. markdown-it still has no concept of frontmatter (or of
 * MDX's own syntax) and would mangle either, so a rebuild always starts with
 * `prepareParseableContent` and restores whatever it split out as real nodes
 * afterward, rather than ever handing that syntax to `setContent`.
 *
 * `isOwnSync` tells an incoming change the editor caused from one it did not;
 * without it, every autosync would read as an external change.
 */
export function useFrontmatterDocument(
	editor: Editor | null,
	content: string,
	isOwnSync: (content: string) => boolean = neverOwnSync,
	fileKind: FileKind = 'markdown'
) {
	// Flipped after the first effect run (the mount pass), per editor *instance*
	// rather than per panel - `useSearchReveal`'s doc comment records why:
	// TipTap rebuilds the editor during startup, and a per-panel guard let the
	// discarded instance consume the one-shot meant for its replacement.
	//
	// Tied to the *pass*, not to whether that pass actually ran a transaction:
	// a note with no frontmatter matches the editor's initial doc immediately,
	// so the mount pass below returns before reaching `setContent` at all - if
	// the flag only flipped there, the next genuine external change would find
	// it still unset and get wrongly treated as the mount-time sync.
	const isMountPass = useRef(true)

	useEffect(() => {
		const wasMountPass = isMountPass.current
		isMountPass.current = false

		if (!editor || content === undefined) return
		if (editor.storage.markdown.getMarkdown() === content) return
		// `content` catches up to the editor by way of its own autosync, and by
		// then the author has usually typed on - so the doc no longer matches
		// what it synced a second ago, and the check above no longer covers it.
		// Rebuilding there would throw away those keystrokes and the caret with
		// them, for a change the editor is the source of.
		if (isOwnSync(content)) return

		const { frontmatter, body, mdxBlocks } = prepareParseableContent(
			content,
			fileKind
		)

		// The mount-time rebuild stays excluded from history: left undoable, it
		// put a phantom step ahead of the user's very first keystroke, so Ctrl+Z
		// on an untouched document cleared it. Every later rebuild is a genuine
		// external change instead, and is left undoable as one clean step -
		// otherwise it leaves the existing history stack referring to a document
		// this replacement just swapped out from under it, and the next Ctrl+Z
		// corrupts the document rather than reverting anything.
		const addToHistory = !wasMountPass

		const chain = editor
			.chain()
			.setMeta('addToHistory', addToHistory)
			.setMeta(CONTENT_SYNC_META, true)
			.setContent(body)
		if (frontmatter !== null) {
			chain.insertContentAt(0, {
				type: 'frontmatter',
				content: [{ type: 'text', text: frontmatterFenceText(frontmatter) }],
			})
		}
		if (mdxBlocks.length > 0) {
			chain.command(({ tr, state }) => {
				restoreMdxBlocksInTransaction(tr, state.schema, mdxBlocks)
				return true
			})
		}
		chain.run()
	}, [content, editor, isOwnSync, fileKind])
}
