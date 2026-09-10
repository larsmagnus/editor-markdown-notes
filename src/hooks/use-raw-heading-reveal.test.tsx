import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useRawHeadingReveal } from '#src/hooks/use-raw-heading-reveal'

const NOTE = '# Title\n\n## Second\n'

function postRevealHeading(hash: string) {
	window.dispatchEvent(
		new MessageEvent('message', { data: { type: 'revealHeading', hash } })
	)
}

function refsFor(textarea: HTMLTextAreaElement, draft: string) {
	textarea.value = draft
	return {
		textareaRef: { current: textarea },
		draftRef: { current: draft },
	}
}

afterEach(() => {
	delete window.headingReveal
})

describe('useRawHeadingReveal', () => {
	it('selects the matching heading on mount when active', () => {
		window.headingReveal = { hash: 'second' }
		const textarea = document.createElement('textarea')
		const { textareaRef, draftRef } = refsFor(textarea, NOTE)

		renderHook(() => useRawHeadingReveal(textareaRef, draftRef, true))

		expect(textarea.selectionStart).toBe(NOTE.indexOf('## Second'))
	})

	it('does nothing on mount when inactive', () => {
		window.headingReveal = { hash: 'second' }
		const textarea = document.createElement('textarea')
		const { textareaRef, draftRef } = refsFor(textarea, NOTE)
		const selectionBefore = textarea.selectionStart

		renderHook(() => useRawHeadingReveal(textareaRef, draftRef, false))

		expect(textarea.selectionStart).toBe(selectionBefore)
	})

	it('selects again on a live revealHeading message while active', () => {
		const textarea = document.createElement('textarea')
		const { textareaRef, draftRef } = refsFor(textarea, NOTE)

		renderHook(() => useRawHeadingReveal(textareaRef, draftRef, true))
		postRevealHeading('second')

		expect(textarea.selectionStart).toBe(NOTE.indexOf('## Second'))
	})

	it('ignores a live revealHeading message while inactive', () => {
		const textarea = document.createElement('textarea')
		const { textareaRef, draftRef } = refsFor(textarea, NOTE)
		const selectionBefore = textarea.selectionStart

		renderHook(() => useRawHeadingReveal(textareaRef, draftRef, false))
		postRevealHeading('second')

		expect(textarea.selectionStart).toBe(selectionBefore)
	})
})
