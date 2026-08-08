/**
 * What host-side code needs from the output channel, and nothing more.
 *
 * `vscode.LogOutputChannel` satisfies this structurally, so the real channel
 * passes straight in. Depending on this instead of `vscode` is what lets a
 * module stay importable from the webview build and testable under vitest.
 */
export interface Logger {
	info(message: string): void
	warn(message: string): void
	error(message: string): void
}
