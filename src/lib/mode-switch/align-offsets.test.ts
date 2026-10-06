import { describe, expect, it } from 'vitest'

import { createOffsetMap } from '#src/lib/mode-switch/align-offsets'

describe('createOffsetMap', () => {
	it('maps every offset to itself when the texts are identical', () => {
		const text = 'Release notes for version 2.4'
		const map = createOffsetMap(text, text)

		expect(map(0)).toBe(0)
		expect(map(8)).toBe(8)
		expect(map(text.length)).toBe(text.length)
	})

	it('follows text shifted by syntax inserted before it', () => {
		const live = 'Shopping\n- milk\n- bread'
		const raw = 'Shopping\n\n- milk\n- bread\n'

		const map = createOffsetMap(live, raw)

		expect(map(live.indexOf('bread'))).toBe(raw.indexOf('bread'))
	})

	it('follows text shifted by an escape the source carries and the document does not', () => {
		const live = 'Costs 5 * 3 dollars, paid by card'
		const raw = 'Costs 5 \\* 3 dollars, paid by card'

		const map = createOffsetMap(live, raw)

		expect(map(live.indexOf('dollars'))).toBe(raw.indexOf('dollars'))
	})

	it('follows text shifted by list indentation', () => {
		const live = '- Groceries\n- Fruit\n- apples'
		const raw = '- Groceries\n  - Fruit\n    - apples'

		const map = createOffsetMap(live, raw)

		expect(map(live.indexOf('apples'))).toBe(raw.indexOf('apples'))
	})

	it('lands inside a changed region rather than past it', () => {
		const live = 'Intro\n![]\nOutro'
		const raw = 'Intro\n![diagram](./images/flow.png)\nOutro'

		const offset = createOffsetMap(live, raw)(live.indexOf(']'))

		expect(offset).toBeGreaterThanOrEqual(raw.indexOf('!['))
		expect(offset).toBeLessThanOrEqual(raw.indexOf('Outro'))
	})

	it('maps the end of one text to the end of the other', () => {
		const live = 'Last paragraph'
		const raw = 'Last paragraph\n'

		expect(createOffsetMap(live, raw)(live.length)).toBe(live.length)
	})

	it('maps any offset into an empty text to zero', () => {
		expect(createOffsetMap('Some text', '')(4)).toBe(0)
	})

	it('maps the inverse direction with the same function', () => {
		const raw = '# Weekly review\n\nShipped **the importer** today.\n'
		const live = '# Weekly review\nShipped **the importer** today.'

		const map = createOffsetMap(raw, live)

		expect(map(raw.indexOf('importer'))).toBe(live.indexOf('importer'))
	})
})
