import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useCopyToClipboard } from '#src/hooks/use-copy-to-clipboard'
import { copyToClipboard } from '#src/lib/clipboard'

vi.mock('#src/lib/clipboard', () => ({ copyToClipboard: vi.fn() }))

afterEach(() => {
	vi.clearAllMocks()
})

describe('useCopyToClipboard', () => {
	it('copies the given text and flips copied to true when called', () => {
		const { result } = renderHook(() => useCopyToClipboard('title: Roadmap'))
		expect(result.current[0]).toBe(false)

		act(() => {
			result.current[1]()
		})

		expect(copyToClipboard).toHaveBeenCalledWith('title: Roadmap')
		expect(result.current[0]).toBe(true)
	})
})
