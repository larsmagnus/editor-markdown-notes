import type * as vscode from 'vscode'

// Relative, not `@/`: this module is also compiled by `tsconfig.extension.json`,
// which has no `paths` mapping precisely so aliases cannot reach the host build.
import type { LogLevel } from '../shared/messages'

/**
 * Seeing inside a webview from the extension host. The page has its own console
 * that nothing here can read, so a bundle that fails to load, a module that
 * throws while evaluating or a React tree that renders nothing all present the
 * same way: a blank panel and an empty output channel.
 *
 * Dependency-free on purpose - the `.vsix` is packaged with `--no-dependencies`,
 * so nothing the host requires at runtime may come from `node_modules`.
 */

/**
 * The reporter, injected ahead of the app bundle so it is listening before the
 * first module evaluates. Kept as a string because it runs in the webview, not
 * here; it assumes `window.vscode` is already assigned.
 */
export const WEBVIEW_LOG_BRIDGE = `
            const post = (level, message) =>
                window.vscode.postMessage({ type: 'log', level, message });

            const describe = (value) => {
                if (value instanceof Error) return value.stack || (value.name + ': ' + value.message);
                if (typeof value === 'string') return value;
                try { return JSON.stringify(value); } catch { return String(value); }
            };

            // Capture phase, because a failed <script>/<link> fires an error
            // event that does not bubble.
            window.addEventListener('error', (event) => {
                if (event.target && event.target !== window) {
                    const target = event.target;
                    post('error', 'Failed to load ' + (target.src || target.href || target.tagName));
                    return;
                }
                post('error', describe(event.error ?? event.message));
            }, true);

            window.addEventListener('unhandledrejection', (event) =>
                post('error', 'Unhandled rejection: ' + describe(event.reason)));

            window.addEventListener('securitypolicyviolation', (event) =>
                post('error', 'CSP blocked ' + event.blockedURI + ' (' + event.violatedDirective + ') from '
                    + (event.sourceFile || 'unknown') + ':' + event.lineNumber));

            // The original runs first, and reporting never takes the console
            // down with it: a throw in here would swallow the very diagnostic
            // being reported.
            for (const level of ['error', 'warn']) {
                const original = console[level];
                console[level] = (...args) => {
                    original(...args);
                    try { post(level, args.map(describe).join(' ')); } catch {}
                };
            }

            // A blank panel with no error at all is its own symptom: the bundle
            // loaded but the tree never mounted.
            window.addEventListener('load', () => setTimeout(() => {
                const root = document.getElementById('root');
                if (!root || !root.hasChildNodes())
                    post('error', 'The app did not mount: #root is still empty.');
            }, 2000));
`

const problems: string[] = []

/** Enough to diagnose a failed load. The output channel keeps the full record,
 * so this only has to stay bounded against a page that logs in a loop. */
const PROBLEM_LIMIT = 100

/** Mirrors a diagnostic the webview reported into the output channel. */
export function recordWebviewLog(
	log: vscode.LogOutputChannel,
	level: LogLevel,
	message: string
) {
	if (level === 'error') log.error(`[webview] ${message}`)
	else if (level === 'warn') log.warn(`[webview] ${message}`)
	else log.info(`[webview] ${message}`)

	if (level === 'info') return

	problems.push(`${level}: ${message}`)
	if (problems.length > PROBLEM_LIMIT) problems.shift()
}

/**
 * Every error and warning a webview has reported this session. A
 * `LogOutputChannel` cannot be read back, and the extension tests have no other
 * way to see inside a webview, so they assert against this.
 */
export function getWebviewProblems(): readonly string[] {
	return problems
}
