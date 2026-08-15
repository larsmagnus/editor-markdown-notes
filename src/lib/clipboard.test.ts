import { afterEach, describe, expect, it, vi } from 'vitest'

import { copyToClipboard } from '@/lib/clipboard'

afterEach(() => {
	vi.unstubAllGlobals()
	vi.restoreAllMocks()
})

describe('copyToClipboard', () => {
	it('writes the text to the clipboard', () => {
		const writeText = vi.fn().mockResolvedValue(undefined)
		vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

		copyToClipboard('title: Roadmap')

		expect(writeText).toHaveBeenCalledWith('title: Roadmap')
	})

	// A webview can be served without clipboard access at all, and a copy
	// button that throws is worse than one that quietly does nothing.
	it('does nothing when there is no clipboard', () => {
		vi.stubGlobal('navigator', { ...navigator, clipboard: undefined })

		expect(() => copyToClipboard('title: Roadmap')).not.toThrow()
	})

	// `writeText` rejects when the document is not focused or permission is
	// denied. Unhandled, that reaches the log bridge as an uncaught rejection
	// and reads like a crash in a panel that is working fine.
	it('reports a rejected write rather than leaving it unhandled', async () => {
		const error = new Error('Document is not focused.')
		const writeText = vi.fn().mockRejectedValue(error)
		vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

		copyToClipboard('title: Roadmap')
		await vi.waitFor(() => expect(consoleError).toHaveBeenCalled())

		expect(consoleError).toHaveBeenCalledWith(
			'Could not copy to the clipboard:',
			error
		)
	})
})
