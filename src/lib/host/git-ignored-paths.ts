/**
 * What `git ls-files --others --ignored --exclude-standard --directory -z`
 * reports: ignored directories collapsed to one entry rather than every file in
 * them, so a `node_modules` costs one line, not thousands.
 */
export type GitIgnoredPaths = {
	directories: ReadonlySet<string>
	files: ReadonlySet<string>
}

/** Splits git's NUL-separated output; a trailing slash marks a collapsed directory. */
export function parseGitIgnoredPaths(output: string): GitIgnoredPaths {
	const entries = output.split('\0').filter((entry) => entry !== '')

	return {
		directories: new Set(
			entries
				.filter((entry) => entry.endsWith('/'))
				.map((entry) => entry.slice(0, -1))
		),
		files: new Set(entries.filter((entry) => !entry.endsWith('/'))),
	}
}

/** Whether the path itself, or any directory above it, is ignored. */
export function isGitIgnored(
	relativePath: string,
	ignored: GitIgnoredPaths
): boolean {
	if (ignored.files.has(relativePath)) return true

	const segments = relativePath.split('/').slice(0, -1)

	return segments.some((_, index) =>
		ignored.directories.has(segments.slice(0, index + 1).join('/'))
	)
}
