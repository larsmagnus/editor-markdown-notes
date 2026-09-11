import { describe, expect, it } from 'vitest'

import { toolbarHeightStyle } from '#src/lib/toolbar-height-style'

describe('toolbarHeightStyle', () => {
	it('reports the toolbar height when the toolbar is shown', () => {
		expect(toolbarHeightStyle(false)).toEqual({ '--toolbar-height': '3.5rem' })
	})

	it('reports zero once the toolbar is hidden', () => {
		expect(toolbarHeightStyle(true)).toEqual({ '--toolbar-height': '0px' })
	})
})
