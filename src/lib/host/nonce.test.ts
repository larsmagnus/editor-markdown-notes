import { describe, expect, it } from 'vitest'

import { createNonce } from '@/lib/host/nonce'

describe('createNonce', () => {
	it('is long enough to be unguessable', () => {
		expect(createNonce()).toHaveLength(32)
	})

	it('uses only characters that need no escaping in an attribute', () => {
		expect(createNonce()).toMatch(/^[A-Za-z0-9]{32}$/)
	})

	it('differs every time, so one document cannot reuse another"s', () => {
		const nonces = new Set(Array.from({ length: 50 }, () => createNonce()))

		expect(nonces.size).toBe(50)
	})
})
