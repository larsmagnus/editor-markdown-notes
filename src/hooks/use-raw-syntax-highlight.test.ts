import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useRawSyntaxHighlight } from '#src/hooks/use-raw-syntax-highlight'

// A stable reference, not a fresh literal per call: the real `useShikiTheme`
// is memoized, and a mock that returns a new object every render would make
// the hook's effect (dependent on `theme`) fire on every render forever.
const testTheme = { themeId: 'test-theme', kind: 'dark', raw: null }
vi.mock('#src/hooks/use-shiki-theme', () => ({
	useShikiTheme: () => testTheme,
}))

vi.mock('#src/lib/shiki-highlighter', () => ({
	getThemedHighlighter: vi.fn(async (theme: { themeId: string }) => ({
		highlighter: {},
		themeId: theme.themeId,
	})),
	ensureLanguage: vi.fn(async () => 'yaml'),
}))

// One token per word, so a remap has more than a single all-or-nothing span
// to prove partial preservation against.
vi.mock('#src/lib/syntax-highlight-tokens', () => ({
	tokenizeBlock: vi.fn(
		async (_highlighter: unknown, block: { text: string }) => {
			const tokens: { offset: number; length: number; color: string }[] = []
			for (const match of block.text.matchAll(/\S+/g)) {
				tokens.push({
					offset: match.index,
					length: match[0].length,
					color: '#ff0000',
				})
			}
			return tokens
		}
	),
}))

/** Real time, not fake timers: the debounce is what creates the race this
 *  hook has to guard against, and advancing it needs the dynamic `import()`s
 *  in between to actually settle. Comfortably past `HIGHLIGHT_DEBOUNCE_MS`. */
const SETTLE_MS = 300

afterEach(() => {
	vi.clearAllMocks()
})

describe('useRawSyntaxHighlight', () => {
	/**
	 * `debouncedDraft` (what tokens were last computed against) lags `draft`
	 * (what's on screen) by up to the debounce window. Dropping every token in
	 * the document for that whole window - rather than carrying the unaffected
	 * ones forward - is what made every keystroke flash the whole note back to
	 * plain text.
	 */
	it('keeps a token untouched by the edit while the debounce is still catching up', async () => {
		const { result, rerender } = renderHook(
			({ draft }) => useRawSyntaxHighlight(draft, true),
			{ initialProps: { draft: 'first' } }
		)

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, SETTLE_MS))
		})
		expect(result.current).toEqual([{ offset: 0, length: 5, color: '#ff0000' }])

		// Still typing: the live draft moves on before the debounce next fires.
		// "first" itself was untouched by the append, so it must still be
		// colored - not dropped just because the document as a whole changed.
		rerender({ draft: 'first second' })

		expect(result.current).toEqual([{ offset: 0, length: 5, color: '#ff0000' }])
	}, 5_000)

	it('keeps the untouched part of an edited token colored, drops only the changed characters', async () => {
		const { result, rerender } = renderHook(
			({ draft }) => useRawSyntaxHighlight(draft, true),
			{ initialProps: { draft: 'hello world' } }
		)

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, SETTLE_MS))
		})
		expect(result.current).toEqual([
			{ offset: 0, length: 5, color: '#ff0000' },
			{ offset: 6, length: 5, color: '#ff0000' },
		])

		// Deletes a character from "hello", leaving "hell" and "world" both
		// still colored - "world" untouched but shifted one position left.
		rerender({ draft: 'hell world' })

		expect(result.current).toEqual([
			{ offset: 0, length: 4, color: '#ff0000' },
			{ offset: 5, length: 5, color: '#ff0000' },
		])
	}, 5_000)

	it('applies freshly tokenized colors again once the debounce catches up', async () => {
		const { result, rerender } = renderHook(
			({ draft }) => useRawSyntaxHighlight(draft, true),
			{ initialProps: { draft: 'first' } }
		)
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, SETTLE_MS))
		})

		rerender({ draft: 'first second' })
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, SETTLE_MS))
		})

		expect(result.current).toEqual([
			{ offset: 0, length: 5, color: '#ff0000' },
			{ offset: 6, length: 6, color: '#ff0000' },
		])
	}, 5_000)
})
