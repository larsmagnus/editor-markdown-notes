import { describe, expect, it } from 'vitest'

import { urlTitleTokens } from '#src/editor/extensions/syntax-reveal/url-title-tokens'

describe('urlTitleTokens', () => {
	it('returns a url token and a trailing marker when there is no title', () => {
		const text = './diagram.png)'

		expect(urlTitleTokens(text, [0, 13], undefined)).toEqual([
			{ role: 'url', from: 0, to: 13 },
			{ role: 'marker', from: text.length - 1, to: text.length },
		])
	})

	it('widens the title range by one on each side to include its quotes', () => {
		const text = './diagram.png "Architecture")'

		expect(urlTitleTokens(text, [0, 13], [15, 27])).toEqual([
			{ role: 'url', from: 0, to: 13 },
			{ role: 'title', from: 14, to: 28 },
			{ role: 'marker', from: text.length - 1, to: text.length },
		])
	})

	it('omits the url token for an empty url range', () => {
		const text: string = ')'

		expect(urlTitleTokens(text, [0, 0], undefined)).toEqual([
			{ role: 'marker', from: 0, to: 1 },
		])
	})
})
