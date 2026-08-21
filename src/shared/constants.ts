/**
 * Identifiers every part of the app agrees on: the extension host, the webview
 * and the MCP server.
 *
 * Separate from `messages.ts`, which is the host ↔ webview *message* contract.
 * These are plain strings with no runtime imports, so this file is safe to pull
 * into all three build graphs - which is the whole reason it exists rather than
 * living in `src/host/`, a directory the webview bundle must never reach
 * into. One `vscode` import added there would break the panel at build time.
 */

/**
 * The extension's own id, and the prefix every command, view type and storage
 * key is built from.
 *
 * Not the id VS Code resolves an installed extension by - that one is qualified
 * with the publisher (`larsmagnus.editor-markdown-notes`) and only the
 * `src/test/**` suites, which look the extension up at runtime, need it.
 */
export const EXTENSION_ID = 'editor-markdown-notes'

/**
 * Separates the workspace folder paths the host hands the MCP server, which
 * takes them as one environment variable and resolves relative note paths
 * against each in turn.
 *
 * A newline, because every other candidate occurs in a real path somewhere:
 * `:` in `C:\…`, `;` and `,` are both legal in a POSIX filename.
 */
export const WORKSPACE_SEPARATOR = '\n'
