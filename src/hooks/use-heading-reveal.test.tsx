import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useHeadingReveal } from '#src/hooks/use-heading-reveal'
import { createEditor } from '#src/test-utils/editor'

const NOTE = '# Title\n\n## Second\n'

function postRevealHeading(hash: string) {
	window.dispatchEvent(
		new MessageEvent('message', { data: { type: 'revealHeading', hash } })
	)
}

beforeEach(() => {
	Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
	delete window.headingReveal
	vi.clearAllMocks()
})

describe('useHeadingReveal', () => {
	it('scrolls to the matching heading on mount when active', () => {
		window.headingReveal = { hash: 'second' }
		const editor = createEditor(NOTE, { mount: true })

		renderHook(() => useHeadingReveal(editor, true))

		expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
	})

	it('does nothing on mount when inactive', () => {
		window.headingReveal = { hash: 'second' }
		const editor = createEditor(NOTE, { mount: true })

		renderHook(() => useHeadingReveal(editor, false))

		expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
	})

	it('scrolls again on a live revealHeading message while active', () => {
		const editor = createEditor(NOTE, { mount: true })

		renderHook(() => useHeadingReveal(editor, true))
		postRevealHeading('second')

		expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
	})

	it('ignores a live revealHeading message while inactive', () => {
		const editor = createEditor(NOTE, { mount: true })

		renderHook(() => useHeadingReveal(editor, false))
		postRevealHeading('second')

		expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
	})

	/** Unlike the mount-time reveal, a live message is not a one-shot: every
	 *  later link click into this same open document must scroll again. */
	it('acts on a second live message, not just the first', () => {
		const editor = createEditor(NOTE, { mount: true })

		renderHook(() => useHeadingReveal(editor, true))
		postRevealHeading('title')
		vi.mocked(Element.prototype.scrollIntoView).mockClear()
		postRevealHeading('second')

		expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
	})
})
