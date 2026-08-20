import type { Logger } from '@/shared/logger'

/**
 * Logging for a process whose stdout is a wire protocol.
 *
 * Everything goes to **stderr**. stdout carries the JSON-RPC frames the client
 * parses, so a single stray line written there desynchronises the transport and
 * the server stops answering - a failure that looks like a hang, not like a log
 * statement. VSCode surfaces stderr in the MCP server's own output view, so
 * nothing is lost by keeping it all on the one stream.
 */
function write(level: string, message: string) {
	process.stderr.write(`${new Date().toISOString()} [${level}] ${message}\n`)
}

export const log: Logger = {
	info: (message) => write('info', message),
	warn: (message) => write('warn', message),
	error: (message) => write('error', message),
}

/**
 * Redirects console output to stderr, so a dependency that logs cannot corrupt
 * the transport.
 *
 * Nothing here writes to stdout deliberately, but the bundle carries retext,
 * nspell and the MCP SDK, and a stray `console.log` anywhere in that tree would
 * be indistinguishable from a protocol frame.
 *
 * `process.stdout.write` itself is deliberately left alone - that is the
 * transport, and patching it would break the thing this protects.
 */
export function keepStdoutForProtocol() {
	const redirect =
		(level: string) =>
		(...args: unknown[]) =>
			write(level, args.map(String).join(' '))

	console.log = redirect('info')
	console.info = redirect('info')
	console.debug = redirect('debug')
	console.warn = redirect('warn')
	console.error = redirect('error')
}

/**
 * Logs what killed the process before it dies.
 *
 * Without this a rejected promise takes the server down silently: the client
 * sees the pipe close mid-call and reports a transport failure, with nothing
 * anywhere saying why.
 */
export function logFatalErrors() {
	process.on('uncaughtException', (error: Error) => {
		log.error(`Uncaught exception: ${error.stack ?? error.message}`)
		process.exit(1)
	})

	process.on('unhandledRejection', (reason: unknown) => {
		log.error(`Unhandled rejection: ${describe(reason)}`)
		process.exit(1)
	})
}

export function describe(error: unknown): string {
	if (error instanceof Error) return error.stack ?? error.message

	return String(error)
}
