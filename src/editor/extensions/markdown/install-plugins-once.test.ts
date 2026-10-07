import { describe, expect, it } from 'vitest'

import { markdownInternals } from '#src/editor/extensions/markdown/block-source/markdown-internals'
import { loadNoteContent } from '#src/editor/load-note-content'
import { createEditor } from '#src/test-utils/editor'

describe('the note parser over a long session', () => {
	it('runs the same rules on the hundredth note it parses as on the first', () => {
		const editor = createEditor('- [ ] Ship it')
		const { md } = markdownInternals(editor).parser
		const rulesAtStart = md.core.ruler.getRules('').length

		for (let note = 0; note < 100; note++) {
			loadNoteContent(editor, `- [ ] Ship it ${note}`, {
				fileKind: 'markdown',
				addToHistory: false,
			})
		}

		expect(md.core.ruler.getRules('')).toHaveLength(rulesAtStart)
	})
})
