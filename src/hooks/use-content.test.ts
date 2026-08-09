import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import useContent from '@/hooks/use-content'

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('useContent', () => {
	it('loads the default note', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async (url: string) => ({
				ok: true,
				text: async () => `contents of ${url}`,
			}))
		)

		const { result } = renderHook(() =>
			useContent({ defaultFileName: 'notes.md' })
		)

		await waitFor(() =>
			expect(result.current.content).toBe('contents of /notes.md')
		)
	})

	it('reports a note the dev server does not have', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => ({ ok: false, text: async () => '<!doctype html>' }))
		)

		const { result } = renderHook(() =>
			useContent({ defaultFileName: 'missing.md' })
		)

		await waitFor(() =>
			expect(result.current.content).toBe('File "missing.md" not found')
		)
	})

	it('fetches nothing while disabled', async () => {
		const fetchMock = vi.fn(async () => ({ ok: true, text: async () => 'x' }))
		vi.stubGlobal('fetch', fetchMock)

		renderHook(() =>
			useContent({ defaultFileName: 'notes.md', enabled: false })
		)

		expect(fetchMock).not.toHaveBeenCalled()
	})

	/**
	 * Switching files fires a second fetch before the first has resolved. Without
	 * a cancellation guard the slower - and now stale - response wins, leaving the
	 * editor showing a note the selector says is no longer open.
	 */
	it('ignores a stale response that resolves after a newer one', async () => {
		const resolvers = new Map<string, (text: string) => void>()
		vi.stubGlobal(
			'fetch',
			vi.fn(
				(url: string) =>
					new Promise((resolve) => {
						resolvers.set(url, (text: string) =>
							resolve({ ok: true, text: async () => text })
						)
					})
			)
		)

		const { result } = renderHook(() =>
			useContent({ defaultFileName: 'notes.md' })
		)

		act(() => result.current.setFileName('other-note.md'))

		// The newer request answers first, then the abandoned one arrives late.
		await act(async () => {
			resolvers.get('/other-note.md')?.('the other note')
		})
		await act(async () => {
			resolvers.get('/notes.md')?.('the first note')
		})

		expect(result.current.content).toBe('the other note')
	})
})
