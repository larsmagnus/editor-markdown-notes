import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useNoteSave } from '@/hooks/use-note-save'
import { updateNotes } from '@/lib/update-notes'

// Resolves rather than returning `undefined`, because the real `updateNotes` is
// `async` and the caller attaches a rejection handler to what it hands back.
vi.mock('@/lib/update-notes', () => ({ updateNotes: vi.fn(async () => {}) }))

const SAVE_DEBOUNCE_MS = 1000

beforeEach(() => {
	vi.useFakeTimers()
})

afterEach(() => {
	vi.useRealTimers()
	vi.clearAllMocks()
})

/** Lets the debounce elapse without waiting on a real second. */
function runDebounce() {
	act(() => {
		vi.advanceTimersByTime(SAVE_DEBOUNCE_MS)
	})
}

describe('useNoteSave', () => {
	/**
	 * The debounce used to be seeded with `''` and guarded with a truthiness
	 * check, so a note the author had emptied looked identical to a note that had
	 * never been typed into - and deleting everything silently never saved.
	 */
	it('saves a note the author has emptied', () => {
		const saveContent = vi.fn()
		renderHook(() =>
			useNoteSave({
				isVSCodeContext: true,
				saveContent,
				currentFile: () => '',
			})
		).result.current.queueSave('')

		runDebounce()

		expect(saveContent).toHaveBeenCalledWith('')
	})

	it('saves a note emptied down to its frontmatter', () => {
		const saveContent = vi.fn()
		const emptied = '---\ntitle: Roadmap\n---\n\n'

		renderHook(() =>
			useNoteSave({
				isVSCodeContext: true,
				saveContent,
				currentFile: () => emptied,
			})
		).result.current.queueSave(emptied)

		runDebounce()

		expect(saveContent).toHaveBeenCalledWith(emptied)
	})

	it('does not save anything before the first edit', () => {
		const saveContent = vi.fn()

		renderHook(() =>
			useNoteSave({
				isVSCodeContext: true,
				saveContent,
				currentFile: () => '# Roadmap',
			})
		)

		runDebounce()

		expect(saveContent).not.toHaveBeenCalled()
	})

	it('coalesces a burst of keystrokes into one save', () => {
		const saveContent = vi.fn()
		const { result } = renderHook(() =>
			useNoteSave({
				isVSCodeContext: true,
				saveContent,
				currentFile: () => '# Roadmap 2026',
			})
		)

		result.current.queueSave('# Road')
		result.current.queueSave('# Roadmap')
		result.current.queueSave('# Roadmap 2026')
		runDebounce()

		expect(saveContent).toHaveBeenCalledTimes(1)
		expect(saveContent).toHaveBeenCalledWith('# Roadmap 2026')
	})

	it('waits for the pause before saving', () => {
		const saveContent = vi.fn()
		const { result } = renderHook(() =>
			useNoteSave({
				isVSCodeContext: true,
				saveContent,
				currentFile: () => '# Roadmap',
			})
		)

		result.current.queueSave('# Roadmap')
		act(() => {
			vi.advanceTimersByTime(SAVE_DEBOUNCE_MS - 100)
		})

		expect(saveContent).not.toHaveBeenCalled()
	})

	// Standalone there is no host to write the file, so the save has to reach the
	// stub instead of being posted into nothing.
	it('routes to the standalone stub when there is no host', () => {
		const saveContent = vi.fn()
		renderHook(() =>
			useNoteSave({
				isVSCodeContext: false,
				saveContent,
				currentFile: () => '# Roadmap',
			})
		).result.current.queueSave('# Roadmap')

		runDebounce()

		expect(updateNotes).toHaveBeenCalledWith('# Roadmap')
		expect(saveContent).not.toHaveBeenCalled()
	})

	describe('Cmd/Ctrl+S', () => {
		it('saves immediately rather than waiting out the debounce', () => {
			const saveContent = vi.fn()
			renderHook(() =>
				useNoteSave({
					isVSCodeContext: true,
					saveContent,
					currentFile: () => '# Roadmap 2026',
				})
			)

			act(() => {
				window.dispatchEvent(new CustomEvent('vscode-save-request'))
			})

			expect(saveContent).toHaveBeenCalledWith('# Roadmap 2026')
		})

		it('saves an emptied note', () => {
			const saveContent = vi.fn()
			renderHook(() =>
				useNoteSave({
					isVSCodeContext: true,
					saveContent,
					currentFile: () => '',
				})
			)

			act(() => {
				window.dispatchEvent(new CustomEvent('vscode-save-request'))
			})

			expect(saveContent).toHaveBeenCalledWith('')
		})

		// `null` is the caller saying it has nothing to serialize yet - an editor
		// that has not finished mounting. Writing that would truncate the file.
		it('writes nothing when the caller has no document yet', () => {
			const saveContent = vi.fn()
			renderHook(() =>
				useNoteSave({
					isVSCodeContext: true,
					saveContent,
					currentFile: () => null,
				})
			)

			act(() => {
				window.dispatchEvent(new CustomEvent('vscode-save-request'))
			})

			expect(saveContent).not.toHaveBeenCalled()
		})

		it('is ignored outside VSCode, where the keystroke is the browser’s', () => {
			const saveContent = vi.fn()
			renderHook(() =>
				useNoteSave({
					isVSCodeContext: false,
					saveContent,
					currentFile: () => '# Roadmap',
				})
			)

			act(() => {
				window.dispatchEvent(new CustomEvent('vscode-save-request'))
			})

			expect(saveContent).not.toHaveBeenCalled()
			expect(updateNotes).not.toHaveBeenCalled()
		})

		it('stops listening once the editor is gone', () => {
			const saveContent = vi.fn()
			const { unmount } = renderHook(() =>
				useNoteSave({
					isVSCodeContext: true,
					saveContent,
					currentFile: () => '# Roadmap',
				})
			)

			unmount()
			act(() => {
				window.dispatchEvent(new CustomEvent('vscode-save-request'))
			})

			expect(saveContent).not.toHaveBeenCalled()
		})
	})
})
