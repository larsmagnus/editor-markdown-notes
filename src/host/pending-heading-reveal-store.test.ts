import { describe, expect, it } from 'vitest'
import type * as vscode from 'vscode'

import { PendingHeadingRevealStore } from '#src/host/pending-heading-reveal-store'

function fakeUri(value: string): vscode.Uri {
	return { toString: () => value } as vscode.Uri
}

describe('PendingHeadingRevealStore', () => {
	it('returns undefined when nothing is pending', () => {
		const store = new PendingHeadingRevealStore()

		expect(store.take(fakeUri('file:///unset.md'))).toBeUndefined()
	})

	it('returns what was set for that uri', () => {
		const store = new PendingHeadingRevealStore()
		const uri = fakeUri('file:///notes.md')
		store.set(uri, 'title')

		expect(store.take(uri)).toEqual({ hash: 'title' })
	})

	it('returns the hash only once', () => {
		const store = new PendingHeadingRevealStore()
		const uri = fakeUri('file:///notes.md')
		store.set(uri, 'title')
		store.take(uri)

		expect(store.take(uri)).toBeUndefined()
	})

	it('keeps different uris independent', () => {
		const store = new PendingHeadingRevealStore()
		const a = fakeUri('file:///a.md')
		const b = fakeUri('file:///b.md')
		store.set(a, 'alpha')
		store.set(b, 'beta')

		expect(store.take(a)).toEqual({ hash: 'alpha' })
		expect(store.take(b)).toEqual({ hash: 'beta' })
	})
})
