import type { ErrorInfo } from 'react'

/**
 * Sends a caught render error to wherever this build can report.
 *
 * `console.error` is the whole implementation because the log bridge in
 * `webview-diagnostics.ts` patches it and forwards to the extension's output
 * channel, which also means this works unchanged in the standalone web app.
 *
 * Reporting has to be explicit: the bridge's startup watchdog only fires while
 * `#root` is empty, and a boundary that renders a fallback fills it - so a
 * contained failure would otherwise leave no trace anywhere.
 */
export function reportError(error: unknown, info: ErrorInfo) {
	console.error('Uncaught error in the webview:', error, info.componentStack)
}
