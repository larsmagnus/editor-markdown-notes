import { it } from 'vitest'

import { alignBlocks } from '#src/editor/extensions/markdown/block-source/align-blocks'
import { parseNoteDocument } from '#src/editor/extensions/markdown/block-source/parse-note-document'
import { untouchedEntry } from '#src/editor/extensions/markdown/block-source/source-registry'
import { openNote } from '#src/test-utils/editor'
it('debug', () => {
	const e = openNote('# Roadmap\n\nShip it.\n\nDone.\n')
	const prev = e.storage.blockSource.registry!
	const cur = e.state.doc.content.content.map(
		(n) => untouchedEntry(prev, n)?.text ?? null
	)
	const { doc, registry } = parseNoteDocument(
		e,
		'# Roadmap 2026\n\nShip it.\n\nDone.\n',
		'markdown'
	)
	const inc = doc.content.content.map(
		(n) => registry.entries.get(n.attrs.sourceId)?.text
	)
	console.log('CUR', JSON.stringify(cur), 'INC', JSON.stringify(inc))
	console.log('AL', JSON.stringify(alignBlocks(cur, inc as string[])))
})
