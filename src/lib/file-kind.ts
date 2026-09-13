export type FileKind = 'markdown' | 'txt' | 'mdx'

/**
 * Determines the file kind based on extension.
 */
export function getFileKind(fileName: string): FileKind {
	const lowered = fileName.toLowerCase()

	if (lowered.endsWith('.txt')) return 'txt'
	if (lowered.endsWith('.mdx')) return 'mdx'

	return 'markdown'
}

/**
 * `.txt` is the only kind with no frontmatter node in its schema, so a
 * leading `---` block has to reach the parser untouched rather than being
 * split off and silently read as metadata.
 */
export function supportsFrontmatter(fileKind: FileKind): boolean {
	return fileKind !== 'txt'
}
