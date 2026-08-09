// Relative, not `@/`: this module is also compiled by `tsconfig.extension.json`,
// which has no `paths` mapping precisely so aliases cannot reach the host build.
import type { ImageBaseUris } from '../shared/messages'

/**
 * Turns an image path from the markdown into something the page can load.
 *
 * In VSCode the webview has its own origin, so a relative path resolves
 * against the extension's bundle rather than the author's folder, and a plain
 * file path is blocked outright. The host supplies `vscode-resource` bases
 * (`window.imageBaseUris`) to resolve against.
 *
 * This is display only - callers keep the original path as the node's `src`
 * attribute, so serializing back to markdown returns what the author wrote.
 * Outside VSCode there are no bases and the path is already correct.
 */
export function resolveImageSrc(
	src: string,
	baseUris: ImageBaseUris | undefined
): string {
	if (!baseUris) return src

	// Already absolute: http(s), data:, or an existing vscode-resource URI.
	if (/^[a-z][a-z0-9+.-]*:/i.test(src)) return src

	// A leading slash means the workspace root, not the server root, so it is
	// stripped and resolved as relative to that base.
	const base = src.startsWith('/') ? baseUris.workspace : baseUris.document

	return new URL(
		src.replace(/^\//, ''),
		`${base.replace(/\/$/, '')}/`
	).toString()
}
