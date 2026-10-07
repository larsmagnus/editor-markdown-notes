import { describe, expect, it } from 'vitest'

import { createEditor, saved } from '#src/test-utils/editor'

/** `markdown` as the editor saves it once nothing of it is kept verbatim. */
function reserialized(markdown: string): string {
	const editor = createEditor()
	editor.commands.setContent(markdown)
	return saved(editor)
}

describe('saving a list', () => {
	it.each([
		['star bullets', '* Buy milk\n* Ship it'],
		['plus bullets', '+ Buy milk\n+ Ship it'],
		['dash bullets', '- Buy milk\n- Ship it'],
		['parenthesised numbers', '1) Buy milk\n2) Ship it'],
		['a list starting at three', '3. Buy milk\n4. Ship it'],
		['star task items', '* [ ] Buy milk\n* [x] Ship it'],
		['a nested star list', '* Buy milk\n  * Oat milk\n* Ship it'],
	])('writes %s with the markers they show', (_name, markdown) => {
		expect(reserialized(markdown)).toBe(markdown)
	})

	it('indents a continuation line past a wide number', () => {
		const markdown = ['9. Nine', '', '10. Ten', '', '    More about ten.'].join(
			'\n'
		)

		expect(reserialized(markdown)).toBe(markdown)
	})
})
