import { describe, expect, it } from 'vitest'

import { errorMessage } from '@/lib/error-message'

describe('errorMessage', () => {
	it('takes the message off an Error', () => {
		expect(errorMessage(new Error('mermaid failed to parse'))).toBe(
			'mermaid failed to parse'
		)
	})

	it('takes the message off an Error subclass', () => {
		expect(errorMessage(new TypeError('src is not a string'))).toBe(
			'src is not a string'
		)
	})

	it('stringifies a thrown string', () => {
		expect(errorMessage('worker terminated')).toBe('worker terminated')
	})

	it('stringifies a thrown object', () => {
		expect(errorMessage({ code: 'ENOENT' })).toBe('[object Object]')
	})

	it('describes a rejection with no reason', () => {
		expect(errorMessage(undefined)).toBe('undefined')
	})
})
