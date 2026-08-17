import { describe, expect, it } from 'vitest'

import { CLAUDE_PROMPT_CONTENT_MAX_LENGTH } from '../shared/messages'

import { buildAskPrompt } from './claude-agent'

describe('buildAskPrompt', () => {
	it('references the note by path, states the prompt, and asks for content only', () => {
		expect(
			buildAskPrompt('Summarise this note', { path: 'notes/roadmap.md' })
		).toBe(
			'Read @notes/roadmap.md. If it is too large to read in full, grep or read the relevant parts instead.\n\nSummarise this note\n\nReply with only the requested content - no preamble like "Here is..." or "Sure, ...", and no commentary about what you did.'
		)
	})

	it('appends the selection as an excerpt, and asks for the rewrite only, when one is given', () => {
		expect(
			buildAskPrompt('Shorten this', {
				path: 'notes/roadmap.md',
				selectedText: 'A long paragraph about the roadmap.',
			})
		).toBe(
			'Read @notes/roadmap.md. If it is too large to read in full, grep or read the relevant parts instead.\n\nShorten this\n\nRewrite only this part of the note:\n"A long paragraph about the roadmap."\n\nReply with only the rewritten text, matching its original formatting - no preamble, no "Before"/"After", and no commentary explaining what changed.'
		)
	})

	it('flattens a multi-line selection into one line', () => {
		const prompt = buildAskPrompt('Improve this', {
			path: 'notes/roadmap.md',
			selectedText: 'Line one\nLine two',
		})

		expect(prompt).toContain('"Line one Line two"')
	})

	it('truncates a selection longer than the excerpt limit', () => {
		const prompt = buildAskPrompt('Shorten this', {
			path: 'notes/roadmap.md',
			selectedText: 'x'.repeat(CLAUDE_PROMPT_CONTENT_MAX_LENGTH + 50),
		})

		expect(prompt).toContain(
			`"${'x'.repeat(CLAUDE_PROMPT_CONTENT_MAX_LENGTH)}..."`
		)
	})
})

// `runClaudeAsk`'s `query()` call itself is not unit-tested - it goes through
// `require('./load-agent-sdk.cjs')` at runtime, a real Node `require` that
// bypasses Vite's module graph (and therefore `vi.mock`), same reason the
// SDK integration is a manual-testing boundary rather than a unit-testing
// one. See the comment on the `tools` option in `claude-agent.ts` for why it
// reads `tools` rather than `allowedTools`.
