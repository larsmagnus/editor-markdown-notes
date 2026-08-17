/**
 * Building the `claude` command line the "Open in Claude" toolbar action
 * runs, from `openClaudeTerminal`'s parameters down.
 *
 * Pure and vscode-free on purpose, so this logic is testable under Vitest -
 * `src/extension/open-claude-terminal-command.ts` handles the vscode I/O
 * (creating the terminal, resolving the document's path) and stays thin.
 */

import { CLAUDE_PROMPT_CONTENT_MAX_LENGTH } from '../shared/messages'

/**
 * Escapes a double-quoted argument for POSIX shells (bash/zsh/fish - the
 * default on macOS/Linux, and common on Windows via Git Bash or WSL).
 *
 * `!` is included even though it isn't a quoting metacharacter: bash and zsh
 * both expand it as history substitution inside a double-quoted string, and
 * backslash-escaping is the one thing that suppresses that there.
 */
export function escapeForPosixShell(value: string): string {
	return value.replace(/[\\$`"!]/g, '\\$&')
}

/** Escapes a double-quoted argument for PowerShell. */
export function escapeForPowerShell(value: string): string {
	return value.replace(/[`"$]/g, '`$&')
}

/**
 * Drops what cmd.exe would still act on inside a double-quoted argument,
 * rather than escaping it: `"`, which cmd has no way to escape (`\"` leaves
 * the backslash and closes the string), and `%`, which expands `%VAR%` even
 * while quoted.
 *
 * Everything else - `&`, `|`, `<`, `>` - is literal for as long as the quotes
 * hold, which removing `"` is what guarantees. That matters here: they are
 * also mermaid's arrows, and the excerpt is only useful while it still looks
 * like the diagram it points at.
 */
export function stripForCmd(value: string): string {
	return value.replace(/["%]/g, '')
}

/** The escaping rules `shellPath` (`vscode.env.shell`) needs. */
export type ShellFamily = 'posix' | 'powershell' | 'cmd'

/** Whether `shellPath` (`vscode.env.shell`) is PowerShell. */
export function isPowerShell(shellPath: string): boolean {
	return /^(pwsh|powershell)(\.exe)?$/i.test(basename(shellPath))
}

/**
 * Which rules apply to `shellPath` (`vscode.env.shell`) - POSIX for anything
 * unrecognized, since that covers bash, zsh, fish, and a Windows user's Git
 * Bash or WSL alike.
 */
export function shellFamily(shellPath: string): ShellFamily {
	if (isPowerShell(shellPath)) return 'powershell'

	return /^cmd(\.exe)?$/i.test(basename(shellPath)) ? 'cmd' : 'posix'
}

function basename(shellPath: string): string {
	return shellPath.split(/[\\/]/).pop() ?? ''
}

export type PromptTokens = {
	/** The note's path relative to the workspace root. */
	path: string
	/** The part of the note being asked about, when it is not the whole note. */
	content?: string
}

/**
 * Fills a prompt template's tokens: `%@` the note as an at-reference, `%s` its
 * bare path, `%c` the excerpt being asked about.
 *
 * One pass over the template rather than a token-at-a-time `replaceAll`, so a
 * path or an excerpt that itself contains `%s` is never substituted into a
 * second time.
 */
export function buildPrompt(template: string, tokens: PromptTokens): string {
	const values: Record<string, string> = {
		'%@': `@${tokens.path}`,
		'%s': tokens.path,
		'%c': toExcerpt(tokens.content ?? ''),
	}

	return template.replace(/%[@sc]/g, (token) => values[token] ?? token)
}

/**
 * Trims an excerpt down to what a prompt can carry: one line (see
 * `toSingleLine`), collapsed whitespace, and no longer than
 * `CLAUDE_PROMPT_CONTENT_MAX_LENGTH`.
 *
 * The result is a locator - enough for Claude to find this part of a file it
 * is separately being told to read - not a faithful copy. Mermaid source in
 * particular is newline-delimited and does not survive the flattening as
 * valid source, which is fine: nothing re-parses it.
 */
export function toExcerpt(content: string): string {
	const flattened = toSingleLine(content).replace(/\s+/g, ' ').trim()

	return flattened.length > CLAUDE_PROMPT_CONTENT_MAX_LENGTH
		? `${flattened.slice(0, CLAUDE_PROMPT_CONTENT_MAX_LENGTH).trimEnd()}...`
		: flattened
}

/**
 * Collapses newlines to spaces. `terminal.sendText` types its argument into a
 * live shell character by character, so an embedded newline lands as an Enter
 * keypress mid-command rather than staying inside the quoted string - no
 * amount of quoting or backslash-escaping keeps a literal newline intact
 * there. `claudePromptTemplate` allows multi-line input (it's a VS Code
 * `multilineText` setting), so this has to run on every prompt, not just
 * ones that look line-broken by mistake.
 */
function toSingleLine(value: string): string {
	return value.replace(/\r?\n+/g, ' ')
}

/**
 * The full `claude "..."` command line for `shellPath` (`vscode.env.shell`) -
 * chosen from the terminal's actual shell, not the host OS, since
 * `process.platform` would apply PowerShell escaping to a Windows user's Git
 * Bash or WSL terminal too.
 */
export function buildClaudeCommand(
	promptTemplate: string,
	tokens: PromptTokens,
	shellPath: string
): string {
	const escapers: Record<ShellFamily, (value: string) => string> = {
		posix: escapeForPosixShell,
		powershell: escapeForPowerShell,
		cmd: stripForCmd,
	}

	const prompt = toSingleLine(buildPrompt(promptTemplate, tokens))

	return `claude "${escapers[shellFamily(shellPath)](prompt)}"`
}
