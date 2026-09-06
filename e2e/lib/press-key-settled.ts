import type { Page } from '@playwright/test'

import { waitForSelectionSettle } from '@/e2e/lib/selection-settle'
import { takeSelectionSnapshot } from '@/e2e/lib/selection-snapshot'

/** Retries an apparent no-op this many times before trusting it as one. */
const MAX_ATTEMPTS = 3

/**
 * Runs `action` and waits for the editor to have caught up with whatever
 * selection change it caused - the real condition behind the flakiness
 * documented in `tmp-e2e-flakiness.md`: something dispatched before the
 * browser has even reported the DOM's own selection change races
 * ProseMirror's read of it, and a key handler (Backspace's, most visibly)
 * acts on a stale position.
 *
 * A key that never moved the DOM's own selection is indistinguishable, from
 * here, between two very different things: a genuine no-op (`End` when the
 * caret is already at the line's end) and the browser silently dropping the
 * key under load - the very failure mode this exists to catch. Re-running
 * `action` closes that gap: a real no-op stays a no-op on every retry, and a
 * dropped key gets another chance to actually land.
 *
 * Safe to retry blindly because every action this wraps either moves the
 * selection or does nothing: a `Backspace` that deletes anything always moves
 * or collapses the selection to the deletion point as part of the same
 * ProseMirror transaction, so a real edit can never be mistaken for a no-op
 * and re-run - only true no-ops repeat.
 */
export async function actionSettled(
	page: Page,
	action: () => Promise<void>,
	timeoutMs = 1000,
	debounceMs = 120
) {
	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
		const before = await page.evaluate(takeSelectionSnapshot)
		await action()
		const changed = await waitForSelectionSettle(
			page,
			before,
			timeoutMs,
			debounceMs
		)
		if (changed || attempt === MAX_ATTEMPTS) return
	}
}

/** `actionSettled` for the common case: a single key press. */
export async function pressKeySettled(page: Page, key: string) {
	await actionSettled(page, () => page.keyboard.press(key))
}
