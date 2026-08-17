import type { ClaudeQueryFn } from './claude-agent-sdk-types'
import { toExcerpt } from './claude-prompt'
import { resolveClaudeExecutable } from './resolve-claude-executable'

export type AskContext = {
	/** The note's path relative to the workspace root. */
	path: string
	/** The selection being asked about, for the bubble menu's proposal flow. */
	selectedText?: string
}

export type AskResult = { ok: true } | { ok: false; error: string }

/**
 * Builds the prompt handed to the Agent SDK: an `@relativePath` reference
 * (the same at-reference convention `buildPrompt`'s `%@` token uses for the
 * terminal flow), with an instruction to fall back to grepping or reading
 * part of the file if it is too large to read outright - the SDK call carries
 * read-only tools (`Read`/`Grep`/`Glob`) precisely so it can act on that.
 *
 * Both callers insert the reply as-is - `/ask` writes it straight into the
 * document, the bubble menu's proposal shows it as the rewrite - so the
 * output instruction is as important as the request itself: without it,
 * Claude tends to wrap a rewrite in "Before/After" commentary explaining what
 * changed, which would land in the note or the proposal card verbatim.
 */
export function buildAskPrompt(prompt: string, context: AskContext): string {
	const reference = `@${context.path}`
	const readInstruction = `Read ${reference}. If it is too large to read in full, grep or read the relevant parts instead.`

	if (context.selectedText) {
		const excerptLine = `\n\nRewrite only this part of the note:\n"${toExcerpt(context.selectedText)}"`
		const outputInstruction =
			'\n\nReply with only the rewritten text, matching its original formatting - no preamble, no "Before"/"After", and no commentary explaining what changed.'
		return `${readInstruction}\n\n${prompt}${excerptLine}${outputInstruction}`
	}

	const outputInstruction =
		'\n\nReply with only the requested content - no preamble like "Here is..." or "Sure, ...", and no commentary about what you did.'
	return `${readInstruction}\n\n${prompt}${outputInstruction}`
}

/**
 * Runs `prompt` through the Agent SDK, streaming text deltas to `onChunk` as
 * they arrive (`includePartialMessages` on the query below), never throwing -
 * every failure (no `claude` on `$PATH`, auth, network, an aborted request)
 * comes back as `{ ok: false, error }` so the host handler can always reply
 * with something instead of leaving a request hanging.
 *
 * Loads `query` from the bundled chunk `agent-sdk-bundle.ts` produces, not
 * `@anthropic-ai/claude-agent-sdk` directly - the `.vsix` ships without
 * `node_modules` (`vsce package --no-dependencies`), so a plain import would
 * 404 at activation. Goes through `load-agent-sdk.cjs`'s dynamic `import()`
 * rather than `require()`, since the bundle is real ESM - see that file.
 */
export async function runClaudeAsk(
	prompt: string,
	context: AskContext,
	cwd: string,
	onChunk: (text: string) => void,
	abortController: AbortController
): Promise<AskResult> {
	const executable = await resolveClaudeExecutable()
	if (!executable) {
		return {
			ok: false,
			error: 'Claude Code CLI not found on PATH. Install it to use Ask Claude.',
		}
	}

	try {
		const {
			loadAgentSdk,
		}: {
			loadAgentSdk: () => Promise<{ query: ClaudeQueryFn }>
		} = require('./load-agent-sdk.cjs')
		const { query } = await loadAgentSdk()

		const stream = query({
			prompt: buildAskPrompt(prompt, context),
			options: {
				cwd,
				// `tools`, not `allowedTools`: the SDK's `allowedTools` only controls
				// which tools skip the permission *prompt* - it does not restrict
				// which tools the model has access to at all (that's `tools`, the
				// base tool set). `permissionMode: 'bypassPermissions'` skips prompts
				// for every tool regardless, so `allowedTools` alone here would leave
				// `Edit`/`Write`/`Bash` fully available and unprompted - `tools` is
				// what actually keeps this call read-only.
				tools: ['Read', 'Grep', 'Glob'],
				permissionMode: 'bypassPermissions',
				allowDangerouslySkipPermissions: true,
				settingSources: [],
				includePartialMessages: true,
				pathToClaudeCodeExecutable: executable,
				abortController,
			},
		})

		for await (const message of stream) {
			if (message.type === 'stream_event' && 'event' in message) {
				const event = message.event
				if (
					event.type === 'content_block_delta' &&
					'delta' in event &&
					event.delta.type === 'text_delta' &&
					'text' in event.delta
				) {
					onChunk(event.delta.text)
				}
				continue
			}

			if (message.type === 'result' && 'is_error' in message) {
				if (!message.is_error) return { ok: true }

				const error =
					'errors' in message && message.errors?.length
						? message.errors.join('; ')
						: 'Claude failed to complete the request.'
				return { ok: false, error }
			}
		}

		// The stream ended without ever sending a `result` message - a clean
		// abort or a disconnected stream, neither of which is a completed,
		// successful request, so this must not report `{ ok: true }`.
		return abortController.signal.aborted
			? { ok: false, error: 'Ask cancelled.' }
			: { ok: false, error: 'Claude ended the request without a result.' }
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : 'Claude request failed.',
		}
	}
}
