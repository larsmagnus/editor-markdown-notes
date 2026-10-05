import { execFile } from 'child_process'

import type { GitIgnoredPaths } from '#src/lib/host/git-ignored-paths'
import { parseGitIgnoredPaths } from '#src/lib/host/git-ignored-paths'

const GIT_TIMEOUT_MS = 5_000

/** Roomy enough for a repo with a great many ignored directories, each one line. */
const GIT_MAX_OUTPUT_BYTES = 64 * 1024 * 1024

/**
 * What git ignores under `folder`, paths relative to it; `null` when git cannot
 * say - not a repository, not installed, or too slow - so the caller falls back
 * to its own exclusions rather than showing or hiding everything.
 */
export function listGitIgnored(
	folder: string
): Promise<GitIgnoredPaths | null> {
	return new Promise((resolve) => {
		execFile(
			'git',
			[
				'ls-files',
				'--others',
				'--ignored',
				'--exclude-standard',
				'--directory',
				'-z',
			],
			{
				cwd: folder,
				timeout: GIT_TIMEOUT_MS,
				maxBuffer: GIT_MAX_OUTPUT_BYTES,
			},
			(error, stdout) => resolve(error ? null : parseGitIgnoredPaths(stdout))
		)
	})
}
