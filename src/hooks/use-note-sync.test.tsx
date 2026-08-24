import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useNoteSync } from '@/hooks/use-note-sync'
import { updateNotes } from '@/lib/update-notes'

// Resolves rather than returning `undefined`, because the real `updateNotes` is
// `async` and the caller attaches a rejection handler to what it hands back.
vi.mock('@/lib/update-notes', () => ({ updateNotes: vi.fn(async () => {}) }))

const SYNC_DEBOUNCE_MS = 1000

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
		vi.advanceTimersByTime(SYNC_DEBOUNCE_MS)
	})
}

describe('useNoteSync', () => {
	/**
	 * The debounce used to be seeded with `''` and guarded with a truthiness
	 * check, so a note the author had emptied looked identical to a note that had
	 * never been typed into - and deleting everything silently never synced.
	 */
	it('syncs a note the author has emptied', () => {
		const syncContent = vi.fn()
		renderHook(() =>
			useNoteSync({
				isVSCodeContext: true,
				syncContent,
				currentFile: () => '',
			})
		).result.current.queueSync('')

		runDebounce()

		expect(syncContent).toHaveBeenCalledWith('')
	})

	it('syncs a note emptied down to its frontmatter', () => {
		const syncContent = vi.fn()
		const emptied = '---\ntitle: Roadmap\n---\n\n'

		renderHook(() =>
			useNoteSync({
				isVSCodeContext: true,
				syncContent,
				currentFile: () => emptied,
			})
		).result.current.queueSync(emptied)

		runDebounce()

		expect(syncContent).toHaveBeenCalledWith(emptied)
	})

	it('does not sync anything before the first edit', () => {
		const syncContent = vi.fn()

		renderHook(() =>
			useNoteSync({
				isVSCodeContext: true,
				syncContent,
				currentFile: () => '# Roadmap',
			})
		)

		runDebounce()

		expect(syncContent).not.toHaveBeenCalled()
	})

	it('coalesces a burst of keystrokes into one sync', () => {
		const syncContent = vi.fn()
		const { result } = renderHook(() =>
			useNoteSync({
				isVSCodeContext: true,
				syncContent,
				currentFile: () => '# Roadmap 2026',
			})
		)

		result.current.queueSync('# Road')
		result.current.queueSync('# Roadmap')
		result.current.queueSync('# Roadmap 2026')
		runDebounce()

		expect(syncContent).toHaveBeenCalledTimes(1)
		expect(syncContent).toHaveBeenCalledWith('# Roadmap 2026')
	})

	it('waits for the pause before syncing', () => {
		const syncContent = vi.fn()
		const { result } = renderHook(() =>
			useNoteSync({
				isVSCodeContext: true,
				syncContent,
				currentFile: () => '# Roadmap',
			})
		)

		result.current.queueSync('# Roadmap')
		act(() => {
			vi.advanceTimersByTime(SYNC_DEBOUNCE_MS - 100)
		})

		expect(syncContent).not.toHaveBeenCalled()
	})

	// Standalone there is no host to write the file, so the sync has to reach
	// the stub instead of being posted into nothing.
	it('routes to the standalone stub when there is no host', () => {
		const syncContent = vi.fn()
		renderHook(() =>
			useNoteSync({
				isVSCodeContext: false,
				syncContent,
				currentFile: () => '# Roadmap',
			})
		).result.current.queueSync('# Roadmap')

		runDebounce()

		expect(updateNotes).toHaveBeenCalledWith('# Roadmap')
		expect(syncContent).not.toHaveBeenCalled()
	})

	// Switching from the live editor to the raw editor unmounts this hook's
	// caller. The debounce library cancels its own pending timer on unmount, so
	// an edit made in the second before the switch used to vanish silently -
	// the raw view then opened on the pre-edit document, not what was just typed.
	it('flushes a pending sync when unmounted before the debounce fires', () => {
		const syncContent = vi.fn()
		const { result, unmount } = renderHook(() =>
			useNoteSync({
				isVSCodeContext: true,
				syncContent,
				currentFile: () => '# Roadmap\n\nShip it. Today.',
			})
		)

		result.current.queueSync('# Roadmap\n\nShip it. Today.')
		unmount()

		expect(syncContent).toHaveBeenCalledWith('# Roadmap\n\nShip it. Today.')
	})

	// The debounced path (`runDebounce()` above) routes a standalone sync
	// through `updateNotes` rather than `syncContent`, which posts to a VS Code
	// API that does not exist outside VSCode. The flush on unmount has to take
	// the same fork.
	it('flushes a pending standalone sync through updateNotes, not syncContent', () => {
		const syncContent = vi.fn()
		const { result, unmount } = renderHook(() =>
			useNoteSync({
				isVSCodeContext: false,
				syncContent,
				currentFile: () => '# Roadmap\n\nShip it. Today.',
			})
		)

		result.current.queueSync('# Roadmap\n\nShip it. Today.')
		unmount()

		expect(updateNotes).toHaveBeenCalledWith('# Roadmap\n\nShip it. Today.')
		expect(syncContent).not.toHaveBeenCalled()
	})

	// Both editor modes stay mounted at once (`EditorBody`), so a view that
	// hides itself instead of unmounting has to flush explicitly, or a
	// keystroke made just before switching away is stuck behind a debounce
	// nothing is left to fire.
	it('flushes a pending sync immediately when asked to', () => {
		const syncContent = vi.fn()
		const { result } = renderHook(() =>
			useNoteSync({
				isVSCodeContext: true,
				syncContent,
				currentFile: () => '# Roadmap\n\nShip it. Today.',
			})
		)

		result.current.queueSync('# Roadmap\n\nShip it. Today.')
		act(() => {
			result.current.flushQueuedSync()
		})

		expect(syncContent).toHaveBeenCalledWith('# Roadmap\n\nShip it. Today.')

		syncContent.mockClear()
		runDebounce()
		expect(syncContent).not.toHaveBeenCalled()
	})

	it('does nothing when flushed with nothing pending', () => {
		const syncContent = vi.fn()
		const { result } = renderHook(() =>
			useNoteSync({
				isVSCodeContext: true,
				syncContent,
				currentFile: () => '# Roadmap',
			})
		)

		act(() => {
			result.current.flushQueuedSync()
		})

		expect(syncContent).not.toHaveBeenCalled()
	})

	it('does not flush on unmount when nothing was ever typed', () => {
		const syncContent = vi.fn()
		const { unmount } = renderHook(() =>
			useNoteSync({
				isVSCodeContext: true,
				syncContent,
				currentFile: () => null,
			})
		)

		unmount()

		expect(syncContent).not.toHaveBeenCalled()
	})

	describe('Cmd/Ctrl+S', () => {
		it('syncs immediately rather than waiting out the debounce', () => {
			const syncContent = vi.fn()
			renderHook(() =>
				useNoteSync({
					isVSCodeContext: true,
					syncContent,
					currentFile: () => '# Roadmap 2026',
				})
			)

			act(() => {
				window.dispatchEvent(new CustomEvent('vscode-save-request'))
			})

			expect(syncContent).toHaveBeenCalledWith('# Roadmap 2026')
		})

		it('syncs an emptied note', () => {
			const syncContent = vi.fn()
			renderHook(() =>
				useNoteSync({
					isVSCodeContext: true,
					syncContent,
					currentFile: () => '',
				})
			)

			act(() => {
				window.dispatchEvent(new CustomEvent('vscode-save-request'))
			})

			expect(syncContent).toHaveBeenCalledWith('')
		})

		// `null` is the caller saying it has nothing to serialize yet - an editor
		// that has not finished mounting. Writing that would truncate the file.
		it('writes nothing when the caller has no document yet', () => {
			const syncContent = vi.fn()
			renderHook(() =>
				useNoteSync({
					isVSCodeContext: true,
					syncContent,
					currentFile: () => null,
				})
			)

			act(() => {
				window.dispatchEvent(new CustomEvent('vscode-save-request'))
			})

			expect(syncContent).not.toHaveBeenCalled()
		})

		it('is ignored outside VSCode, where the keystroke is the browser’s', () => {
			const syncContent = vi.fn()
			renderHook(() =>
				useNoteSync({
					isVSCodeContext: false,
					syncContent,
					currentFile: () => '# Roadmap',
				})
			)

			act(() => {
				window.dispatchEvent(new CustomEvent('vscode-save-request'))
			})

			expect(syncContent).not.toHaveBeenCalled()
			expect(updateNotes).not.toHaveBeenCalled()
		})

		it('stops listening once the editor is gone', () => {
			const syncContent = vi.fn()
			const { unmount } = renderHook(() =>
				useNoteSync({
					isVSCodeContext: true,
					syncContent,
					currentFile: () => '# Roadmap',
				})
			)

			unmount()
			act(() => {
				window.dispatchEvent(new CustomEvent('vscode-save-request'))
			})

			expect(syncContent).not.toHaveBeenCalled()
		})
	})
})
