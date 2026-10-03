/**
 * Copies `text`, tolerating a webview that has no clipboard to copy to.
 *
 * The one place the app touches `navigator.clipboard`, so a test can mock this
 * module instead of the global. That matters more than it sounds: a stub built
 * as `{ ...navigator, clipboard }` drops the prototype getters `userAgent` and
 * `platform`, which ProseMirror reads when it constructs an editor - so
 * replacing the global breaks any test that also mounts one.
 *
 * Resolves to whether the text was written, so a caller can hold back its
 * "Copied" feedback for a copy that did not happen.
 *
 * `writeText` rejects when the document is not focused or permission is
 * denied. Reported rather than swallowed: `console.error` is what the log
 * bridge forwards to the extension's output channel (see `report-error.ts`),
 * and left unhandled it would surface as an uncaught rejection instead.
 */
export async function copyToClipboard(text: string) {
	try {
		await navigator.clipboard?.writeText(text)
		return Boolean(navigator.clipboard)
	} catch (error) {
		console.error('Could not copy to the clipboard:', error)
		return false
	}
}
