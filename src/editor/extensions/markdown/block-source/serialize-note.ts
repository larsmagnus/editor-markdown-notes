import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import { serializeBlock } from '#src/editor/extensions/markdown/block-source/serialize-block'
import {
	isBlankLine,
	untouchedEntry,
} from '#src/editor/extensions/markdown/block-source/source-registry'
import type {
	SourceEntry,
	SourceRegistry,
} from '#src/editor/extensions/markdown/block-source/source-registry'

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

/** A top-level block, and the text it was written as - empty for a blank line. */
type WrittenBlock = { node: ProseMirrorNode; text: string }

type WrittenNote = { markdown: string; blocks: WrittenBlock[] }

/**
 * The note as last written, per document: a sync asks for the markdown it is
 * about to send and then for the blocks it was written from, and serializing
 * twice cost a second pass of every changed block's escape checks.
 */
const lastWritten = new WeakMap<
	ProseMirrorNode,
	{ registry: SourceRegistry; note: WrittenNote }
>()

/**
 * The whole note as markdown, writing every block the author has not touched
 * exactly as it was read and re-serializing only the rest - so an edit
 * changes the file where it was made and nowhere else.
 *
 * Trailing empty paragraphs are never written: one is where the caret rests
 * after a closing block, and commands like outdent leave more behind, none of
 * them lines anyone typed.
 */
export function writeNote(
	editor: Editor,
	registry: SourceRegistry
): WrittenNote {
	const { doc } = editor.state
	const remembered = lastWritten.get(doc)
	if (remembered?.registry === registry) return remembered.note

	const note = writeNoteAfresh(editor, registry)
	lastWritten.set(doc, { registry, note })
	return note
}

/** `writeNote`, without looking for a result to reuse. */
function writeNoteAfresh(
	editor: Editor,
	registry: SourceRegistry
): WrittenNote {
	const blocks: WrittenBlock[] = []
	let out = ''
	let previous: SourceEntry | null = null
	let written = false
	let blankLines = 0

	const { doc } = editor.state
	for (let index = 0; index < doc.childCount; index++) {
		const node = doc.child(index)
		if (isBlankLine(node)) {
			blankLines++
			blocks.push({ node, text: '' })
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
		blocks.push({ node, text })
		previous = entry
		written = true
		blankLines = 0
	}

	return { markdown: out + registry.trailingGap, blocks }
}

/** The whole note as markdown - see `writeNote`. */
export function serializeNote(
	editor: Editor,
	registry: SourceRegistry
): string {
	return writeNote(editor, registry).markdown
}
