import { describe, expect, it } from 'vitest'

import { isAiToolPath } from '#src/lib/host/ai-tool-paths'

describe('isAiToolPath', () => {
	it.each([
		['.claude/commands/review.md'],
		['.cursor/rules/style.md'],
		['.windsurf/rules/style.md'],
		['.codex/prompts/plan.md'],
		['.gemini/GEMINI.md'],
		['.continue/rules/team.md'],
		['.agents/skills/deploy.md'],
		['.roo/rules/style.md'],
		['.cline/rules/style.md'],
		['.aider.chat.history.md'],
		['.aider/notes.md'],
		['.github/copilot-instructions.md'],
		['.github/instructions/frontend.instructions.md'],
	])('recognises %s', (relativePath) => {
		expect(isAiToolPath(relativePath)).toBe(true)
	})

	it('recognises an AI-tool directory nested in a monorepo package', () => {
		expect(isAiToolPath('packages/web/.claude/rules/react.md')).toBe(true)
	})

	it.each([
		['README.md'],
		['docs/guide.md'],
		['.github/pull_request_template.md'],
		['.github/workflows/notes.md'],
		['test-results/report.md'],
		['claude/notes.md'],
		['docs/.claude-notes.md'],
		['.aiderignore'],
		['.aider-notes/ideas.md'],
	])('does not recognise %s', (relativePath) => {
		expect(isAiToolPath(relativePath)).toBe(false)
	})

	it('treats instruction files at the root as ordinary notes', () => {
		expect(isAiToolPath('CLAUDE.md')).toBe(false)
		expect(isAiToolPath('AGENTS.md')).toBe(false)
	})
})
