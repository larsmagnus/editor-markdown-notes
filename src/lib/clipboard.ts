/**
 * Copies `text`, tolerating a webview that has no clipboard to copy to.
 *
 * The one place the app touches `navigator.clipboard`, so a test can mock this
 * module instead of the global. That matters more than it sounds: a stub built
 * as `{ ...navigator, clipboard }` drops the prototype getters `userAgent` and
 * `platform`, which ProseMirror reads when it constructs an editor - so
 * replacing the global breaks any test that also mounts one.
 *
 * `writeText` rejects when the document is not focused or permission is
 * denied. Reported rather than swallowed: `console.error` is what the log
 * bridge forwards to the extension's output channel (see `report-error.ts`),
 * and left unhandled it would surface as an uncaught rejection instead.
 */
export function copyToClipboard(text: string) {
	navigator.clipboard?.writeText(text).catch((error: unknown) => {
		console.error('Could not copy to the clipboard:', error)
	})
}
