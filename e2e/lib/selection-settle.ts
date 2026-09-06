import type { Page } from '@playwright/test'

import type { SelectionSnapshot } from '@/e2e/lib/selection-snapshot'

/**
 * Counts native `selectionchange` events on `document`, from page load.
 *
 * ProseMirror's `DOMObserver` reads the browser's real selection out of this
 * event synchronously, so it's the one signal separating "the DOM's selection
 * moved" from "`editor.state.selection` has caught up" - what
 * `press-key-settled.ts` waits on. Must run before the app's own bundle
 * evaluates, so call this right where `page.addInitScript` would normally go,
 * before `page.goto`.
 */
export async function createSelectionChangeCounter(page: Page) {
	await page.addInitScript(() => {
		let count = 0
		document.addEventListener(
			'selectionchange',
			() => {
				count += 1
			},
			true
		)
		Object.defineProperty(window, '__selectionChangeCount', {
			get: () => count,
		})
	})
}

/**
 * Resolves once the count has changed from `before` *and then gone quiet* for
 * `debounceMs` - not on the first change alone. A code block re-tokenizing
 * under Shiki can fire a `selectionchange` of its own, unrelated to the key
 * just pressed; resolving on the first event risks moving on before the real
 * one has landed, observed as an arrow that never advanced the caret.
 *
 * Returns `false` once `timeoutMs` elapses with the DOM's selection still
 * unchanged from `before`, rather than throwing - the caller
 * (`press-key-settled.ts`'s `actionSettled`) decides what that means, since a
 * genuine no-op (`End` at the line's end) looks identical to a key the
 * browser silently dropped under load. Only a DOM selection that *did* move
 * with no event ever seen for it is a real inconsistency, raised as an error.
 *
 * Polls on `setTimeout`, not `requestAnimationFrame`: Chromium pauses rAF for
 * a backgrounded page (one of many under parallel workers), so a poll gated
 * on it can read a pending `selectionchange` as settled when it was simply
 * never checked. A wall-clock timer keeps firing regardless of visibility.
 *
 * Self-contained (the DOM signature is inlined, not imported): `page.evaluate`
 * serializes only this function's own source, so a call to a sibling helper
 * would be a `ReferenceError` in the browser.
 */
function waitForSettle({
	before,
	timeoutMs,
	debounceMs,
}: {
	before: SelectionSnapshot
	timeoutMs: number
	debounceMs: number
}): Promise<boolean> {
	function domSignatureNow(): string {
		const selection = document.getSelection()
		if (!selection) return ''
		return [
			selection.anchorNode?.textContent?.slice(0, 20),
			selection.anchorOffset,
			selection.focusNode?.textContent?.slice(0, 20),
			selection.focusOffset,
		].join('|')
	}

	return new Promise((resolve, reject) => {
		const deadline = performance.now() + timeoutMs
		let lastSeq = before.seq
		let lastChangeAt = -Infinity

		const check = () => {
			const seqNow = window.__selectionChangeCount ?? 0
			const now = performance.now()
			if (seqNow !== lastSeq) {
				lastSeq = seqNow
				lastChangeAt = now
			}

			const changed = lastSeq !== before.seq
			if (changed && now - lastChangeAt >= debounceMs) {
				resolve(true)
				return
			}

			if (now > deadline) {
				if (changed) {
					resolve(true)
				} else if (domSignatureNow() === before.dom) {
					resolve(false) // No event, and the DOM agrees nothing moved.
				} else {
					reject(
						new Error(
							`DOM selection changed but no selectionchange event followed within ${timeoutMs}ms`
						)
					)
				}
				return
			}

			setTimeout(check, 4)
		}

		check()
	})
}

/** Returns whether a real, settled selection change was observed. */
export async function waitForSelectionSettle(
	page: Page,
	before: SelectionSnapshot,
	timeoutMs: number,
	debounceMs: number
): Promise<boolean> {
	return page.evaluate(waitForSettle, { before, timeoutMs, debounceMs })
}
