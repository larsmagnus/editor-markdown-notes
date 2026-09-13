/**
 * File extensions this extension's markdown editor treats as full markdown
 * documents, lowercase and including the leading dot.
 */
const MARKDOWN_FILE_EXTENSIONS = [
	'.md',
	'.markdown',
	'.mdown',
	'.mkd',
	'.mdx',
	'.txt',
] as const

/**
 * True if `pathOrUriPath` (a filesystem path or a `vscode.Uri.path`) ends
 * with one of `MARKDOWN_FILE_EXTENSIONS`, case-insensitively - `.pdf` is
 * deliberately excluded, handled by a separate command path.
 */
export function isMarkdownFile(pathOrUriPath: string): boolean {
	const lowered = pathOrUriPath.toLowerCase()
	return MARKDOWN_FILE_EXTENSIONS.some((extension) =>
		lowered.endsWith(extension)
	)
}
