import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren, ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useShikiTheme } from '@/hooks/use-shiki-theme'
import { ThemeContext } from '@/hooks/use-theme'

function withTheme(theme: 'dark' | 'light') {
	return function Wrapper({ children }: PropsWithChildren): ReactNode {
		return (
			<ThemeContext.Provider value={{ theme, setTheme: () => null }}>
				{children}
			</ThemeContext.Provider>
		)
	}
}

function bootInsideVSCode() {
	const postMessage = vi.fn()
	window.vscode = { postMessage, getState: vi.fn(), setState: vi.fn() }
	return postMessage
}

afterEach(() => {
	delete window.vscode
	vi.clearAllMocks()
})

describe('useShikiTheme', () => {
	it('uses the bundled dark theme outside VS Code when the toggle is dark', () => {
		const { result } = renderHook(() => useShikiTheme(), {
			wrapper: withTheme('dark'),
		})

		expect(result.current.themeId).toBe('bundled-default-dark')
		expect(result.current.kind).toBe('dark')
	})

	it('uses the bundled light theme outside VS Code when the toggle is light', () => {
		const { result } = renderHook(() => useShikiTheme(), {
			wrapper: withTheme('light'),
		})

		expect(result.current.themeId).toBe('bundled-default-light')
		expect(result.current.kind).toBe('light')
	})

	it('requests the host theme once mounted inside VS Code', () => {
		const postMessage = bootInsideVSCode()
		renderHook(() => useShikiTheme(), { wrapper: withTheme('dark') })

		expect(postMessage).toHaveBeenCalledWith({ type: 'getShikiTheme' })
	})

	it('uses the host theme when its kind matches the current dark/light toggle', () => {
		bootInsideVSCode()
		const { result } = renderHook(() => useShikiTheme(), {
			wrapper: withTheme('dark'),
		})

		act(() => {
			window.dispatchEvent(
				new MessageEvent('message', {
					data: {
						type: 'shikiTheme',
						themeId: 'Dracula',
						kind: 'dark',
						raw: { name: 'Dracula' },
					},
				})
			)
		})

		expect(result.current).toEqual({
			themeId: 'Dracula',
			kind: 'dark',
			raw: { name: 'Dracula' },
		})
	})

	/**
	 * VS Code only ever has one active theme. Switching the extension's own
	 * toggle to light while VS Code itself stays dark must not keep a dark
	 * theme's text colors over a light background - that combination reads as
	 * unreadable noise, which is the bug this hook exists to prevent.
	 */
	it('falls back to the bundled theme when the host theme is the wrong side of the toggle', () => {
		bootInsideVSCode()
		const { result } = renderHook(() => useShikiTheme(), {
			wrapper: withTheme('light'),
		})

		act(() => {
			window.dispatchEvent(
				new MessageEvent('message', {
					data: {
						type: 'shikiTheme',
						themeId: 'Dracula',
						kind: 'dark',
						raw: { name: 'Dracula' },
					},
				})
			)
		})

		expect(result.current.themeId).toBe('bundled-default-light')
		expect(result.current.kind).toBe('light')
	})

	it('falls back to the bundled theme when the host failed to extract one', () => {
		bootInsideVSCode()
		const { result } = renderHook(() => useShikiTheme(), {
			wrapper: withTheme('dark'),
		})

		act(() => {
			window.dispatchEvent(
				new MessageEvent('message', {
					data: {
						type: 'shikiTheme',
						themeId: 'Broken Theme',
						kind: 'dark',
						raw: null,
					},
				})
			)
		})

		expect(result.current.themeId).toBe('bundled-default-dark')
		expect(result.current.kind).toBe('dark')
	})

	it('treats a high-contrast host theme as belonging to the dark side', () => {
		bootInsideVSCode()
		const { result } = renderHook(() => useShikiTheme(), {
			wrapper: withTheme('dark'),
		})

		act(() => {
			window.dispatchEvent(
				new MessageEvent('message', {
					data: {
						type: 'shikiTheme',
						themeId: 'Contrast Dark',
						kind: 'high-contrast',
						raw: { name: 'Contrast Dark' },
					},
				})
			)
		})

		expect(result.current.themeId).toBe('Contrast Dark')
	})
})
