/**
 * The readable text of a thrown value. `catch` binds `unknown`, and a rejected
 * promise can carry anything at all, so the non-`Error` case is real.
 *
 * The webview log bridge in `webview-diagnostics.ts` keeps its own copy: it is
 * a string injected into the page ahead of the bundle and cannot import.
 */
export function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error)
}
