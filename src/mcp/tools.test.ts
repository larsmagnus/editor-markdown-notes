import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { beforeAll, describe, expect, it } from 'vitest'

import { listChecks } from '@/mcp/checks'
import { copyDictionaries } from '@/mcp/copy-dictionaries'
import { suggestDictionaryWords } from '@/mcp/jargon'
import { checkMarkdown } from '@/mcp/tools'
import type { CheckDefaults } from '@/mcp/tools'
import { TEXT_TOOL_RULE_IDS } from '@/shared/messages'

/**
 * Runs the real pipeline rather than a stub, because the point of these tools
 * is that an agent gets the same answers the panel does - a mocked analysis
 * would prove only that the plumbing holds.
 */
beforeAll(() => {
	// The server reads its dictionaries from a directory the build populates.
	// Populated here through that same script, so the spelling tests neither
	// depend on a prior build nor duplicate how the files are found.
	process.env.EMN_DICTIONARY_DIR = copyDictionaries(
		join(mkdtempSync(join(tmpdir(), 'emn-dictionaries-')), 'dictionaries')
	)
})

const defaults: CheckDefaults = {
	rules: [...TEXT_TOOL_RULE_IDS],
	targetAge: 16,
	spellingLanguage: 'en-US',
	ignoreWords: [],
}

describe('checkMarkdown', () => {
	it('anchors each finding to the line and the sentence around it', async () => {
		const note = '# Release notes\n\nThe report was written by the committee.\n'

		const { issues } = await checkMarkdown(
			note,
			{ rules: ['passive'] },
			defaults
		)

		expect(issues).toEqual([
			{
				rule: 'passive',
				severity: 'warning',
				line: 3,
				column: 16,
				actual: 'written',
				sentence: 'The report was written by the committee.',
				expected: [],
				message: 'Unexpected use of the passive voice',
			},
		])
	})

	it('leaves code blocks and inline code unchecked', async () => {
		const note = [
			'Run `pnpm bild` to check.',
			'',
			'```js',
			'const utilise = 1',
			'```',
		].join('\n')

		const { issues } = await checkMarkdown(note, {}, defaults)

		expect(issues).toEqual([])
	})

	it('checks prose in a frontmatter value but not its key', async () => {
		const note = '---\ndescription: The report was written\n---\n\nFine.\n'

		const { issues } = await checkMarkdown(
			note,
			{ rules: ['passive'] },
			defaults
		)

		expect(issues.map((issue) => [issue.line, issue.actual])).toEqual([
			[2, 'written'],
		])
	})

	it('summarizes readability the way the panel words it', async () => {
		const note =
			'We utilise this form to commence the process, and it is a very unique approach that was decided upon by the group after a long and genuinely quite exhausting series of meetings.\n'

		const { summary } = await checkMarkdown(
			note,
			{ rules: ['readability'], targetAge: 10 },
			defaults
		)

		expect(summary).toContain('1 of 1 sentence is hard to read')
	})

	it('offers a correction for a misspelling', async () => {
		const note = 'This sentence has a typpo in it.\n'

		const { issues } = await checkMarkdown(
			note,
			{ rules: ['spelling'] },
			defaults
		)

		expect(issues[0]?.actual).toBe('typpo')
		expect(issues[0]?.expected).toContain('typo')
	})

	it('honours the ignore words the user has already accepted', async () => {
		const note = 'We ship the nspell dictionary.\n'

		const { issues } = await checkMarkdown(
			note,
			{ rules: ['spelling'] },
			{ ...defaults, ignoreWords: ['nspell'] }
		)

		expect(issues).toEqual([])
	})
})

describe('suggestDictionaryWords', () => {
	it('marks a repeated unknown word as likely jargon', async () => {
		const note =
			'The nspell dictionary loads first. Then nspell checks each word. Finally nspell reports.\n'

		const candidates = await suggestDictionaryWords(note, {}, defaults)

		expect(candidates[0]).toMatchObject({
			word: 'nspell',
			occurrences: 3,
			likelyJargon: true,
		})
	})

	it('leaves a one-off typo with a near match unflagged', async () => {
		const note = 'This sentence has a typpo in it.\n'

		const candidates = await suggestDictionaryWords(note, {}, defaults)

		expect(candidates).toEqual([
			{
				word: 'typpo',
				occurrences: 1,
				suggestions: expect.arrayContaining(['typo']),
				likelyJargon: false,
			},
		])
	})
})

describe('listChecks', () => {
	it('describes every rule the panel offers', () => {
		expect(listChecks().map((check) => check.id)).toEqual([
			...TEXT_TOOL_RULE_IDS,
		])
	})
})
