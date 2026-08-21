import { describe, expect, it } from 'vitest'

import { CLAUDE_PROMPT_CONTENT_MAX_LENGTH } from '../shared/messages'

import {
	buildClaudeCommand,
	buildPrompt,
	escapeForPosixShell,
	escapeForPowerShell,
	isPowerShell,
	shellFamily,
	stripForCmd,
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

describe('stripForCmd', () => {
	it('drops double quotes, which cmd cannot escape', () => {
		expect(stripForCmd('graph TD; A["one"] --> B')).toBe(
			'graph TD; A[one] --> B'
		)
	})

	it('drops percent signs, which cmd expands even inside quotes', () => {
		expect(stripForCmd('Read %USERPROFILE% for me')).toBe(
			'Read USERPROFILE for me'
		)
	})

	// They are mermaid's arrows, and inert as long as the quotes hold - which
	// dropping every `"` is what guarantees.
	it('keeps the metacharacters that only act outside quotes', () => {
		expect(stripForCmd('A --> B | C & D')).toBe('A --> B | C & D')
	})
})

describe('shellFamily', () => {
	it('recognizes cmd.exe by basename', () => {
		expect(shellFamily('C:\\Windows\\System32\\cmd.exe')).toBe('cmd')
		expect(shellFamily('CMD.EXE')).toBe('cmd')
	})

	it('recognizes PowerShell', () => {
		expect(shellFamily('/usr/bin/pwsh')).toBe('powershell')
	})

	// POSIX is the fallback rather than a list to match, since it covers bash,
	// zsh and fish alike - including through Git Bash and WSL on Windows.
	it('falls back to POSIX for anything else', () => {
		expect(shellFamily('/bin/zsh')).toBe('posix')
		expect(shellFamily('C:\\Program Files\\Git\\bin\\bash.exe')).toBe('posix')
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
	it('substitutes every %@ with the note as an at-reference', () => {
		expect(
			buildPrompt('Read %@ and summarize %@', { path: 'notes/roadmap.md' })
		).toBe('Read @notes/roadmap.md and summarize @notes/roadmap.md')
	})

	it('substitutes every %s with the bare relative path', () => {
		expect(
			buildPrompt('Read @%s and summarize %s', { path: 'notes/roadmap.md' })
		).toBe('Read @notes/roadmap.md and summarize notes/roadmap.md')
	})

	it('substitutes %c with the excerpt being asked about', () => {
		expect(
			buildPrompt('Look at "%c" in %@', {
				path: 'notes/roadmap.md',
				content: 'flowchart LR',
			})
		).toBe('Look at "flowchart LR" in @notes/roadmap.md')
	})

	it('leaves %c empty when there is no excerpt', () => {
		expect(buildPrompt('Read %@ ("%c")', { path: 'notes/roadmap.md' })).toBe(
			'Read @notes/roadmap.md ("")'
		)
	})

	it('returns the template unchanged when it has no tokens', () => {
		expect(
			buildPrompt('What should I write about?', { path: 'notes/roadmap.md' })
		).toBe('What should I write about?')
	})

	// One pass, not one `replaceAll` per token - otherwise a path carrying a
	// token would be substituted into a second time.
	it('does not substitute into a path that itself contains a token', () => {
		expect(buildPrompt('Read %@', { path: 'notes/%s-draft.md' })).toBe(
			'Read @notes/%s-draft.md'
		)
	})

	it('flattens a multi-line excerpt onto one line', () => {
		expect(
			buildPrompt('%c', {
				path: 'notes/roadmap.md',
				content: 'flowchart LR\n  A[Start] --> B[Done]\n',
			})
		).toBe('flowchart LR A[Start] --> B[Done]')
	})

	it('truncates an excerpt longer than the limit', () => {
		const prompt = buildPrompt('%c', {
			path: 'notes/roadmap.md',
			content: 'x'.repeat(CLAUDE_PROMPT_CONTENT_MAX_LENGTH + 50),
		})

		expect(prompt).toBe(`${'x'.repeat(CLAUDE_PROMPT_CONTENT_MAX_LENGTH)}...`)
	})
})

describe('buildClaudeCommand', () => {
	it('escapes for POSIX when the shell is zsh', () => {
		expect(
			buildClaudeCommand(
				'Read %@, is it done!',
				{ path: 'roadmap.md' },
				'/bin/zsh'
			)
		).toBe('claude "Read @roadmap.md, is it done\\!"')
	})

	it('escapes for PowerShell when the shell is pwsh', () => {
		expect(
			buildClaudeCommand(
				'Read %@, is it done!',
				{ path: 'roadmap.md' },
				'pwsh.exe'
			)
		).toBe('claude "Read @roadmap.md, is it done!"')
	})

	// cmd cannot escape a literal inside a quoted argument, so an excerpt from
	// someone else's note could otherwise close the quote and run what follows.
	it('strips shell metacharacters rather than escaping them for cmd.exe', () => {
		expect(
			buildClaudeCommand(
				'Focus on "%c"',
				{ path: 'roadmap.md', content: 'graph TD; A --> B" & calc.exe & "' },
				'C:\\Windows\\System32\\cmd.exe'
			)
		).toBe('claude "Focus on graph TD; A --> B & calc.exe & "')
	})

	// The excerpt reaches the host from the webview, so it is the one part of
	// the prompt an author never reviewed.
	it('escapes shell metacharacters that arrive in the excerpt', () => {
		expect(
			buildClaudeCommand(
				'Focus on "%c"',
				{ path: 'roadmap.md', content: 'graph TD; A["$(whoami)"] --> B' },
				'/bin/zsh'
			)
		).toBe('claude "Focus on \\"graph TD; A[\\"\\$(whoami)\\"] --> B\\""')
	})

	it('collapses newlines in a multi-line template into spaces', () => {
		// `claudePromptTemplate` is a VS Code `multilineText` setting - a
		// literal newline sent via `terminal.sendText` types as an Enter
		// keypress mid-command, so it can never survive into the built command.
		expect(
			buildClaudeCommand(
				'Explain this file:\n%s\n\nWhat does it do?',
				{ path: 'roadmap.md' },
				'/bin/zsh'
			)
		).toBe('claude "Explain this file: roadmap.md What does it do?"')
	})
})
