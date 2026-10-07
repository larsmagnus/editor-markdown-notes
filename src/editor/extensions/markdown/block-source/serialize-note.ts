import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { serializeBlock } from '#src/editor/extensions/markdown/block-source/serialize-block'
import type {
	SourceEntry,
	SourceRegistry,
} from '#src/editor/extensions/markdown/block-source/source-registry'

/** The registry entry `node` still matches, if the author has not changed it since. */
function untouchedEntry(
	registry: SourceRegistry,
	node: ProseMirrorNode
): SourceEntry | null {
	const id: unknown = node.attrs.sourceId
	if (typeof id !== 'number') return null

	const entry = registry.entries.get(id)
	if (!entry) return null
	// Identity first: an untouched node is the very object that was loaded.
	// `eq` catches the one an undo rebuilt with the same content.
	return entry.node === node || entry.node.eq(node) ? entry : null
}

function isBlankLine(node: ProseMirrorNode): boolean {
	return node.type.name === 'paragraph' && node.content.size === 0
}

/**
 * The text between two written blocks: exactly what the note had there when
 * both are untouched and were neighbours, otherwise one blank line plus one
 * more for every empty paragraph the author left between them.
 */
function separator(
	previous: SourceEntry | null,
	next: SourceEntry | null,
	nextId: unknown,
	blankLines: number
): string {
	if (previous && next && blankLines === 0 && previous.nextId === nextId) {
		return previous.gapAfter
	}
	return `\n\n${'\n'.repeat(blankLines)}`
}

/**
 * The whole note as markdown, writing every block the author has not touched
 * exactly as it was read and re-serializing only the rest - so an edit
 * changes the file where it was made and nowhere else.
 *
 * Trailing empty paragraphs are never written: one is where the caret rests
 * after a closing block, and commands like outdent leave more behind, none of
 * them lines anyone typed.
 */
export function serializeNote(
	editor: Editor,
	registry: SourceRegistry
): string {
	let out = ''
	let previous: SourceEntry | null = null
	let written = false
	let blankLines = 0

	const { doc } = editor.state
	for (let index = 0; index < doc.childCount; index++) {
		const node = doc.child(index)
		if (isBlankLine(node)) {
			blankLines++
			continue
		}

		const entry = untouchedEntry(registry, node)
		const text = entry ? entry.text : serializeBlock(editor, node)
		if (!written) {
			const leading = entry && node.attrs.sourceId === registry.firstId
			out = (leading ? registry.leadingGap : '') + '\n'.repeat(blankLines)
		} else {
			out += separator(previous, entry, node.attrs.sourceId, blankLines)
		}

		out += text
		previous = entry
		written = true
		blankLines = 0
	}

	return out + registry.trailingGap
}
