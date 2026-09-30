import { describe, expect, it } from 'vitest'

import { isAgenticNote } from '#src/lib/note-index/agentic-note'

describe('isAgenticNote', () => {
	it('recognises a note inside .claude', () => {
		expect(isAgenticNote('.claude/skills/release', 'SKILL.md')).toBe(true)
	})

	it('recognises a note inside a nested .claude folder', () => {
		expect(isAgenticNote('packages/web/.claude/agents', 'reviewer.md')).toBe(
			true
		)
	})

	it('recognises a note inside .cursor', () => {
		expect(isAgenticNote('.cursor/rules', 'style.md')).toBe(true)
	})

	it('recognises a note inside .codex', () => {
		expect(isAgenticNote('.codex', 'instructions.md')).toBe(true)
	})

	it('recognises a note inside .gemini', () => {
		expect(isAgenticNote('.gemini', 'styleguide.md')).toBe(true)
	})

	it('recognises a note inside .windsurf', () => {
		expect(isAgenticNote('.windsurf/rules', 'testing.md')).toBe(true)
	})

	it('recognises a note inside .agents', () => {
		expect(isAgenticNote('.agents/skills', 'SKILL.md')).toBe(true)
	})

	it('recognises Copilot prompt files under .github', () => {
		expect(isAgenticNote('.github/prompts', 'review.prompt.md')).toBe(true)
	})

	it('recognises Copilot instructions under .github', () => {
		expect(isAgenticNote('.github/instructions', 'react.instructions.md')).toBe(
			true
		)
	})

	it('recognises the Copilot instructions file itself', () => {
		expect(isAgenticNote('.github', 'copilot-instructions.md')).toBe(true)
	})

	it('leaves other .github notes alone', () => {
		expect(isAgenticNote('.github', 'CONTRIBUTING.md')).toBe(false)
	})

	it('recognises AGENTS.md at the root', () => {
		expect(isAgenticNote('', 'AGENTS.md')).toBe(true)
	})

	it('recognises CLAUDE.md in a subfolder', () => {
		expect(isAgenticNote('packages/api', 'CLAUDE.md')).toBe(true)
	})

	it('recognises CLAUDE.local.md', () => {
		expect(isAgenticNote('', 'CLAUDE.local.md')).toBe(true)
	})

	it('recognises GEMINI.md', () => {
		expect(isAgenticNote('', 'GEMINI.md')).toBe(true)
	})

	it('recognises llms.txt', () => {
		expect(isAgenticNote('public', 'llms.txt')).toBe(true)
	})

	it('matches a convention file name regardless of case', () => {
		expect(isAgenticNote('', 'agents.md')).toBe(true)
	})

	it('leaves an ordinary note alone', () => {
		expect(isAgenticNote('docs', 'roadmap.md')).toBe(false)
	})

	it('does not mistake a folder merely named like a tool', () => {
		expect(isAgenticNote('docs/claude', 'notes.md')).toBe(false)
	})
})
