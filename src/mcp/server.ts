import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

import { listChecks } from '@/mcp/checks'
import { defaults, OPTIONS, readSource, SOURCE } from '@/mcp/environment'
import { suggestDictionaryWords } from '@/mcp/jargon'
import { describe, keepStdoutForProtocol, log, logFatalErrors } from '@/mcp/log'
import { runTool } from '@/mcp/run-tool'
import { checkMarkdown } from '@/mcp/tools'
import { EXTENSION_ID } from '@/shared/constants'
import { TEXT_TOOL_RULE_IDS } from '@/shared/messages'

/**
 * The MCP server, run as a child process of the extension host.
 *
 * A separate process rather than an HTTP server inside the host: it keeps the
 * retext stack and a ~550kB word list off the host's event loop, which every
 * other extension in the window shares, and leaves no port open. The cost is
 * that this process has no `vscode` module, so it reads rather than writes -
 * see `suggest_dictionary_words`.
 *
 * Its own esbuild bundle (`out/mcp/server.mjs`), and unlike the Agent SDK it
 * needs no `.cjs` loader shim: that shim exists because the CommonJS host has
 * to reach an ES module, while this is a fresh `node` process loading its own
 * entry directly.
 */

keepStdoutForProtocol()
logFatalErrors()

const server = new McpServer({
	name: EXTENSION_ID,
	version: '0.1.0',
})

server.registerTool(
	'check_markdown',
	{
		title: 'Check markdown writing quality',
		description:
			"Runs the Editor Markdown Notes writing checks over a note and reports what they found: passive voice, wordy phrasing, weak intensifiers, hard-to-read sentences and (when enabled) spelling. Results match what the extension's sidebar shows for the same file, and use the user's own configured reading age and English variant. Each issue carries the line and column in the markdown file plus the sentence containing it - use that sentence as the exact-match anchor when editing. Prose only: code blocks, inline code and link URLs are excluded.",
		inputSchema: {
			...SOURCE,
			...OPTIONS,
			rules: z
				.array(z.enum(TEXT_TOOL_RULE_IDS))
				// Rejected rather than honoured, so asking for no checks is a visible
				// error instead of an empty report that reads as a clean note.
				.min(1)
				.optional()
				.describe(
					"Which checks to run. Defaults to the user's enabled set in the extension."
				),
		},
		annotations: { readOnlyHint: true },
	},
	async ({ path, text, rules, targetAge, language }) =>
		runTool('check_markdown', () =>
			checkMarkdown(
				readSource({ path, text }),
				{ rules, targetAge, language },
				defaults
			)
		)
)

server.registerTool(
	'list_checks',
	{
		title: 'List the available writing checks',
		description:
			"Describes each writing check this server can run, in the wording the extension uses, with a worked example of what it flags and how to fix it. Call this to explain a finding to the user in the extension's own terms rather than paraphrasing, or to see which rule ids `check_markdown` accepts.",
		inputSchema: {},
		annotations: { readOnlyHint: true },
	},
	async () => runTool('list_checks', () => listChecks())
)

server.registerTool(
	'check_readability',
	{
		title: 'Find sentences above a reading age',
		description:
			'Reports only the sentences that read harder than a target age, so a rewrite can be iterated against a concrete goal. Sentences still too hard six years past the target are marked `very-hard`. Cheaper and quieter than a full `check_markdown` when readability is the only thing being worked on.',
		inputSchema: { ...SOURCE, ...OPTIONS },
		annotations: { readOnlyHint: true },
	},
	async ({ path, text, targetAge, language }) =>
		runTool('check_readability', () =>
			checkMarkdown(
				readSource({ path, text }),
				{ rules: ['readability'], targetAge, language },
				defaults
			)
		)
)

server.registerTool(
	'check_spelling',
	{
		title: 'Spell-check a note',
		description:
			'Spell-checks the prose in a markdown file against a Hunspell dictionary, with suggested corrections. Code blocks, inline code and link URLs are excluded, but technical vocabulary will still be flagged - use `suggest_dictionary_words` to tell those apart from real mistakes before correcting anything.',
		inputSchema: { ...SOURCE, language: OPTIONS.language },
		annotations: { readOnlyHint: true },
	},
	async ({ path, text, language }) =>
		runTool('check_spelling', () =>
			checkMarkdown(
				readSource({ path, text }),
				{ rules: ['spelling'], language },
				defaults
			)
		)
)

server.registerTool(
	'suggest_dictionary_words',
	{
		title: 'Find project vocabulary the speller rejects',
		description:
			'Groups the words the speller rejected by how often they occur and flags the ones that look like project vocabulary rather than mistakes - a word used repeatedly, or one the dictionary has no near match for. Advisory only: this server cannot change the user\'s settings, so report the candidates and let them add the ones they want through the extension\'s "Add words to dictionary" command.',
		inputSchema: { ...SOURCE, language: OPTIONS.language },
		annotations: { readOnlyHint: true },
	},
	async ({ path, text, language }) =>
		runTool('suggest_dictionary_words', () =>
			suggestDictionaryWords(readSource({ path, text }), { language }, defaults)
		)
)

try {
	await server.connect(new StdioServerTransport())
	log.info('MCP server ready')
} catch (error) {
	log.error(`MCP server failed to start: ${describe(error)}`)
	process.exit(1)
}
