import { readFileSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'

import { z } from 'zod'

import type { CheckDefaults } from '@/mcp/tools'
import { WORKSPACE_SEPARATOR } from '@/shared/constants'
import {
	DEFAULT_SETTINGS,
	DEFAULT_VIEW_OPTIONS,
	SPELLING_LANGUAGES,
	TEXT_TOOL_RULE_IDS,
} from '@/shared/messages'

/**
 * The host's configuration, handed over as environment variables when VS Code
 * starts this process. Every field degrades to the extension's own default
 * rather than throwing, so a malformed value costs one setting instead of the
 * whole server.
 */
/** The reading-age scale every check accepts, shared so it's defined once. */
const TARGET_AGE_RANGE = z.coerce.number().int().min(5).max(30)

const Defaults = z.object({
	// `.min(1)` so an empty list degrades to the defaults like every other field
	// here. Left to mean what it says, a user who had switched every check off in
	// the panel would get an empty report from every call - which an agent reads
	// as "this note is clean" rather than "nothing was checked".
	EMN_RULES: z
		.string()
		.transform((value) => value.split(',').filter(Boolean))
		.pipe(z.array(z.enum(TEXT_TOOL_RULE_IDS)).min(1))
		.catch(DEFAULT_VIEW_OPTIONS.textToolRules),
	EMN_TARGET_AGE: TARGET_AGE_RANGE.catch(DEFAULT_SETTINGS.textToolsTargetAge),
	EMN_SPELLING_LANGUAGE: z
		.enum(SPELLING_LANGUAGES)
		.catch(DEFAULT_VIEW_OPTIONS.spellingLanguage),
	EMN_IGNORE_WORDS: z
		.string()
		.transform((value) => value.split(',').filter(Boolean))
		.catch([]),
	EMN_WORKSPACE: z.string().catch(''),
})

const environment = Defaults.parse(process.env)

export const defaults: CheckDefaults = {
	rules: environment.EMN_RULES,
	targetAge: environment.EMN_TARGET_AGE,
	spellingLanguage: environment.EMN_SPELLING_LANGUAGE,
	ignoreWords: environment.EMN_IGNORE_WORDS,
}

/** Either half of a source is accepted; `path` wins when both are given. */
export const SOURCE = {
	path: z
		.string()
		.optional()
		.describe(
			'Path to a markdown file. Relative paths resolve against the workspace root.'
		),
	text: z
		.string()
		.optional()
		.describe('Markdown to check directly, when it is not on disk yet.'),
}

export const OPTIONS = {
	targetAge: TARGET_AGE_RANGE.optional().describe(
		"Reading age to score against. Defaults to the user's setting."
	),
	language: z
		.enum(SPELLING_LANGUAGES)
		.optional()
		.describe("English variant. Defaults to the user's setting."),
}

export function readSource(input: { path?: string; text?: string }): string {
	if (input.path) return readNote(input.path)

	if (input.text === undefined) {
		throw new Error(
			'Provide either a `path` to a markdown file or the `text` to check.'
		)
	}

	return input.text
}

/**
 * Reads a note, saying what was looked for when it is not there.
 *
 * Node's own `ENOENT` names the resolved absolute path but not the root a
 * relative one was resolved against, which is the part an agent gets wrong -
 * the server's workspace is not necessarily the directory the agent thinks in.
 *
 * Every root is tried, not just the first: in a multi-root workspace a path is
 * relative to whichever folder its note lives in, and resolving only against
 * folder one reports a file that exists as missing.
 */
function readNote(path: string): string {
	if (isAbsolute(path)) return readFileSync(path, 'utf8')

	const roots = workspaceRoots()

	for (const root of roots) {
		try {
			return readFileSync(resolve(root, path), 'utf8')
		} catch {
			continue
		}
	}

	throw new Error(
		`Could not read "${path}". Tried it against ${roots.join(', ')}. Pass an absolute path if the note is outside the workspace.`
	)
}

function workspaceRoots(): string[] {
	const roots =
		environment.EMN_WORKSPACE.split(WORKSPACE_SEPARATOR).filter(Boolean)

	return roots.length > 0 ? roots : [process.cwd()]
}
