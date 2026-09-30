import { describe, expect, it } from 'vitest'

import { expandBraces } from '#src/lib/host/expand-braces'

describe('expandBraces', () => {
	it('leaves a pattern without braces as it is', () => {
		expect(expandBraces('**/archive/**')).toEqual(['**/archive/**'])
	})

	it('expands one group into its alternatives', () => {
		expect(expandBraces('**/*.{js,map}')).toEqual(['**/*.js', '**/*.map'])
	})

	it('expands a nested group', () => {
		expect(expandBraces('{docs,{notes,drafts}}/*.md')).toEqual([
			'docs/*.md',
			'notes/*.md',
			'drafts/*.md',
		])
	})

	it('leaves an unbalanced brace in place', () => {
		expect(expandBraces('**/{archive/**')).toEqual(['**/{archive/**'])
	})
})
