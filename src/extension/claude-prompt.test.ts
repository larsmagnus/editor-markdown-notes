import { describe, expect, it } from 'vitest'

import {
	buildClaudeCommand,
	buildPrompt,
	escapeForPosixShell,
	escapeForPowerShell,
	isPowerShell,
} from './claude-prompt'

describe('escapeForPosixShell', () => {
	it('backslash-escapes double quotes, backslashes, backticks and dollar signs', () => {
		expect(escapeForPosixShell('say "hi" \\ `whoami` $HOME')).toBe(
			'say \\"hi\\" \\\\ \\`whoami\\` \\$HOME'
		)
	})

	it('backslash-escapes ! so bash/zsh history expansion does not fire', () => {
		expect(escapeForPosixShell('is it done!')).toBe('is it done\\!')
	})

	it('leaves plain text untouched', () => {
		expect(escapeForPosixShell('Read this note please')).toBe(
			'Read this note please'
		)
	})
})

describe('escapeForPowerShell', () => {
	it('backtick-escapes double quotes, backticks and dollar signs', () => {
		expect(escapeForPowerShell('say "hi" `whoami` $HOME')).toBe(
			'say `"hi`" ``whoami`` `$HOME'
		)
	})

	it('does not escape !, which has no special meaning in PowerShell', () => {
		expect(escapeForPowerShell('is it done!')).toBe('is it done!')
	})
})

describe('isPowerShell', () => {
	it('recognizes pwsh and powershell.exe by basename, case-insensitively', () => {
		expect(isPowerShell('/usr/bin/pwsh')).toBe(true)
		expect(
			isPowerShell(
				'C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
			)
		).toBe(true)
		expect(isPowerShell('PWSH.EXE')).toBe(true)
	})

	it('rejects other shells', () => {
		expect(isPowerShell('/bin/zsh')).toBe(false)
		expect(isPowerShell('C:\\Windows\\System32\\cmd.exe')).toBe(false)
		expect(isPowerShell('C:\\Program Files\\Git\\bin\\bash.exe')).toBe(false)
	})
})

describe('buildPrompt', () => {
	it('substitutes every %s with the relative path', () => {
		expect(buildPrompt('Read @%s and summarize %s', 'notes/roadmap.md')).toBe(
			'Read @notes/roadmap.md and summarize notes/roadmap.md'
		)
	})

	it('returns the template unchanged when it has no %s placeholder', () => {
		expect(buildPrompt('What should I write about?', 'notes/roadmap.md')).toBe(
			'What should I write about?'
		)
	})
})

describe('buildClaudeCommand', () => {
	it('escapes for POSIX when the shell is zsh', () => {
		expect(
			buildClaudeCommand('Read @%s, is it done!', 'roadmap.md', '/bin/zsh')
		).toBe('claude "Read @roadmap.md, is it done\\!"')
	})

	it('escapes for PowerShell when the shell is pwsh', () => {
		expect(
			buildClaudeCommand('Read @%s, is it done!', 'roadmap.md', 'pwsh.exe')
		).toBe('claude "Read @roadmap.md, is it done!"')
	})

	it('collapses newlines in a multi-line template into spaces', () => {
		// `claudePromptTemplate` is a VS Code `multilineText` setting - a
		// literal newline sent via `terminal.sendText` types as an Enter
		// keypress mid-command, so it can never survive into the built command.
		expect(
			buildClaudeCommand(
				'Explain this file:\n%s\n\nWhat does it do?',
				'roadmap.md',
				'/bin/zsh'
			)
		).toBe('claude "Explain this file: roadmap.md What does it do?"')
	})
})
