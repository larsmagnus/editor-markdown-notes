/**
 * Building the `claude` command line the "Open in Claude" toolbar action
 * runs, from `openClaudeTerminal`'s parameters down.
 *
 * Pure and vscode-free on purpose, so this logic is testable under Vitest -
 * `src/extension/open-claude-terminal-command.ts` handles the vscode I/O
 * (creating the terminal, resolving the document's path) and stays thin.
 */

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
 * Whether `shellPath` (`vscode.env.shell`) is PowerShell - the only non-POSIX
 * shell this module knows how to escape for. `cmd.exe` isn't handled (no
 * reliable literal-string escaping for it); out of scope for now.
 */
export function isPowerShell(shellPath: string): boolean {
	const shellName = shellPath.split(/[\\/]/).pop() ?? ''
	return /^(pwsh|powershell)(\.exe)?$/i.test(shellName)
}

export function buildPrompt(template: string, relativePath: string): string {
	return template.includes('%s')
		? template.replaceAll('%s', relativePath)
		: template
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
	relativePath: string,
	shellPath: string
): string {
	const prompt = toSingleLine(buildPrompt(promptTemplate, relativePath))
	const escapedPrompt = isPowerShell(shellPath)
		? escapeForPowerShell(prompt)
		: escapeForPosixShell(prompt)

	return `claude "${escapedPrompt}"`
}
