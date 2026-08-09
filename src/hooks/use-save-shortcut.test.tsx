import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useSaveShortcut } from '@/hooks/use-save-shortcut'

let requests: number

function count() {
	requests += 1
}

beforeEach(() => {
	requests = 0
	window.addEventListener('vscode-save-request', count)
})

afterEach(() => {
	window.removeEventListener('vscode-save-request', count)
})

/** The keystroke as it arrives at `window`, cancelable so preventDefault reads. */
function pressSave(overrides: KeyboardEventInit = {}) {
	const event = new KeyboardEvent('keydown', {
		key: 's',
		metaKey: true,
		cancelable: true,
		...overrides,
	})
	window.dispatchEvent(event)

	return event
}

describe('useSaveShortcut', () => {
	it('turns Cmd+S into a save request', () => {
		renderHook(() => useSaveShortcut(true))

		pressSave()

		expect(requests).toBe(1)
	})

	it('turns Ctrl+S into a save request', () => {
		renderHook(() => useSaveShortcut(true))

		pressSave({ metaKey: false, ctrlKey: true })

		expect(requests).toBe(1)
	})

	// Otherwise the browser's own save-page dialog opens over the editor.
	it('stops the browser handling the keystroke itself', () => {
		renderHook(() => useSaveShortcut(true))

		expect(pressSave().defaultPrevented).toBe(true)
	})

	it('ignores an unmodified s', () => {
		renderHook(() => useSaveShortcut(true))

		pressSave({ metaKey: false })

		expect(requests).toBe(0)
	})

	it('ignores other modified keys', () => {
		renderHook(() => useSaveShortcut(true))

		pressSave({ key: 'a' })

		expect(requests).toBe(0)
	})

	// Standalone the keystroke belongs to the browser, and there is no file to
	// write anyway.
	it('does nothing when it is not enabled', () => {
		renderHook(() => useSaveShortcut(false))

		const event = pressSave()

		expect(requests).toBe(0)
		expect(event.defaultPrevented).toBe(false)
	})

	it('stops listening once unmounted', () => {
		renderHook(() => useSaveShortcut(true)).unmount()

		pressSave()

		expect(requests).toBe(0)
	})
})
