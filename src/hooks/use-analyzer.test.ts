import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useAnalyzer } from '@/hooks/use-analyzer'

const disposeMock = vi.fn()
const createAnalyzerMock = vi.fn(() => ({
	analyze: vi.fn(),
	dispose: disposeMock,
}))

vi.mock('@/lib/text-tools/analyze-client', () => ({
	createAnalyzer: () => createAnalyzerMock(),
}))

describe('useAnalyzer', () => {
	/**
	 * Turning text tools off while `import('@/lib/text-tools/analyze-client')`
	 * is still in flight used to leak a worker: `disposeAnalyzer()` ran while
	 * `analyzerRef` was still empty (a no-op), then the import resolved and
	 * created one anyway - the panel was closed, but nothing tore it down until
	 * unmount or the next enable.
	 */
	it('does not create a worker if disposed while the import is still in flight', async () => {
		const { result } = renderHook(() => useAnalyzer())

		const analyzerPromise = result.current.getAnalyzer()
		act(() => {
			result.current.disposeAnalyzer()
		})

		const analyzer = await analyzerPromise

		expect(analyzer).toBeNull()
		expect(disposeMock).not.toHaveBeenCalled()
	})

	it('still returns a worker when not disposed mid-import', async () => {
		const { result } = renderHook(() => useAnalyzer())

		const analyzer = await result.current.getAnalyzer()

		expect(analyzer).not.toBeNull()
	})
})
