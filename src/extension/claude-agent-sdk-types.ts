/**
 * Hand-written types for exactly the slice of `@anthropic-ai/claude-agent-sdk`
 * this extension calls through `agent-sdk-bundle.js` (see that file).
 *
 * Not imported from the package itself: its types are only reachable through
 * an `exports` map "types" condition, which `tsconfig.extension.json`'s
 * `module: "CommonJS"` resolution does not understand, and the package is an
 * ESM-only dependency the dependency-free host never has in `node_modules` at
 * runtime anyway - only at build time, to feed esbuild.
 */

type ClaudeTextDelta = {
	type: 'content_block_delta'
	delta: { type: 'text_delta'; text: string } | { type: string }
}

type ClaudeStreamEvent = {
	type: 'stream_event'
	event: ClaudeTextDelta | { type: string }
}

type ClaudeResultMessage =
	| { type: 'result'; subtype: 'success'; is_error: boolean; result: string }
	| {
			type: 'result'
			subtype: string
			is_error: boolean
			errors?: string[]
	  }

type ClaudeSDKMessage =
	| ClaudeStreamEvent
	| ClaudeResultMessage
	| { type: string }

type ClaudeQueryOptions = {
	prompt: string
	options: {
		cwd?: string
		tools?: string[]
		permissionMode?: string
		allowDangerouslySkipPermissions?: boolean
		settingSources?: string[]
		includePartialMessages?: boolean
		pathToClaudeCodeExecutable?: string
		abortController?: AbortController
	}
}

export type ClaudeQueryFn = (
	params: ClaudeQueryOptions
) => AsyncIterable<ClaudeSDKMessage>
