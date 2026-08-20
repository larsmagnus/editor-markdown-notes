import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { copyToClipboard } from '@/lib/clipboard'

vi.mock('@/lib/clipboard', () => ({ copyToClipboard: vi.fn() }))

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
