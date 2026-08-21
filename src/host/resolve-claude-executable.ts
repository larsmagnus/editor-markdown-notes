import { execFile } from 'node:child_process'

/**
 * Locates the `claude` CLI on `$PATH`, so the Agent SDK call can be pointed
 * at it via `pathToClaudeCodeExecutable` instead of the SDK's own bundled
 * binary - an optional platform dependency weighing hundreds of megabytes,
 * unfit for anything this extension ships or downloads on a user's behalf.
 * Same prerequisite the "Open in Claude" terminal action already has: a
 * `claude` install on `$PATH`.
 *
 * Only a successful lookup is cached for the life of the extension host - the
 * CLI's location does not change mid-session once found, and every ask would
 * otherwise re-shell out for it. A "not found" result is never cached: a user
 * who installs the CLI (or fixes `$PATH`) partway through a session should
 * not have every retry fail until the extension host restarts.
 */
let cached: string | undefined
let pending: Promise<string | undefined> | undefined

export function resolveClaudeExecutable(): Promise<string | undefined> {
	if (cached) return Promise.resolve(cached)
	pending ??= lookUp().then((path) => {
		pending = undefined
		if (path) cached = path
		return path
	})
	return pending
}

function lookUp(): Promise<string | undefined> {
	const [command, args] =
		process.platform === 'win32' ? ['where', ['claude']] : ['which', ['claude']]

	return new Promise((resolve) => {
		execFile(command, args, (error, stdout) => {
			if (error) {
				resolve(undefined)
				return
			}

			resolve(stdout.split(/\r?\n/)[0]?.trim() || undefined)
		})
	})
}
