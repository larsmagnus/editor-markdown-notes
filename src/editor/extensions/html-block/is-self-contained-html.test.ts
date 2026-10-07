import { describe, expect, it } from 'vitest'

import { isSelfContainedHtml } from '#src/editor/extensions/html-block/is-self-contained-html'

describe('isSelfContainedHtml', () => {
	it.each([
		['a closed element', '<div>\nShip it.\n</div>'],
		[
			'nested elements',
			'<details><summary>Plan</summary><p>Ship it.</p></details>',
		],
		['void and self-closing elements', '<img src="plan.png">\n<br/>'],
		['a comment', '<!-- an aside -->'],
		['a comment holding a tag', '<!-- <div> -->'],
	])('accepts %s', (_name, source) => {
		expect(isSelfContainedHtml(source)).toBe(true)
	})

	it.each([
		[
			'the opening half of a split element',
			'<details>\n<summary>Plan</summary>',
		],
		['the closing half of a split element', '</details>'],
		['crossed elements', '<b><i>Ship</b></i>'],
	])('rejects %s', (_name, source) => {
		expect(isSelfContainedHtml(source)).toBe(false)
	})
})
