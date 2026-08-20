import { describe, log } from '@/mcp/log'

/**
 * Runs one tool call: logs it, and shapes whatever comes back.
 *
 * Errors are logged with their stack and then rethrown rather than swallowed.
 * The SDK turns a thrown error into an `isError` result carrying its message,
 * so the agent gets something it can act on while the stack - which would be
 * noise to a model - stays in the server's own log.
 */
export async function runTool<T>(name: string, run: () => Promise<T> | T) {
	const started = Date.now()

	try {
		const value = await run()
		log.info(`${name} completed in ${Date.now() - started}ms`)

		return {
			content: [
				{ type: 'text' as const, text: JSON.stringify(value, null, 2) },
			],
		}
	} catch (error) {
		log.error(
			`${name} failed after ${Date.now() - started}ms: ${describe(error)}`
		)
		throw error
	}
}
