import dictionaryEn from 'dictionary-en'
import dictionaryEnGb from 'dictionary-en-gb'
import retextEnglish from 'retext-english'
import { unified } from 'unified'
import { VFile } from 'vfile'
import { describe, expect, it } from 'vitest'

import { spellingIssues } from '@/lib/text-tools/spelling-issues'

const decoder = new TextDecoder()

/**
 * The real dictionaries, read straight from the packages - under Node they load
 * themselves off disk, where the browser build hands the worker `?raw` text.
 * Decoded to strings because that is what nspell can actually parse: handed a
 * `Uint8Array` it stringifies the byte array and flags every word in the file.
 */
const AMERICAN = {
	aff: decoder.decode(dictionaryEn.aff),
	dic: decoder.decode(dictionaryEn.dic),
}

const BRITISH = {
	aff: decoder.decode(dictionaryEnGb.aff),
	dic: decoder.decode(dictionaryEnGb.dic),
}

function parse(text: string) {
	return unified().use(retextEnglish).parse(new VFile(text))
}

describe('spellingIssues', () => {
	it('flags a misspelled word and suggests the right one', async () => {
		const text = 'We recieved the report.'

		const issues = await spellingIssues(parse(text), text, {
			language: 'en-US',
			dictionary: AMERICAN,
			ignoreWords: [],
		})

		expect(issues).toHaveLength(1)
		expect(issues[0]).toMatchObject({
			ruleId: 'spelling',
			severity: 'misspelling',
			actual: 'recieved',
		})
		expect(issues[0].expected).toContain('received')
		expect(text.slice(issues[0].start, issues[0].end)).toBe('recieved')
	})

	it('measures against the language it is given', async () => {
		const text = 'The colour of the paper.'

		const american = await spellingIssues(parse(text), text, {
			language: 'en-US',
			dictionary: AMERICAN,
			ignoreWords: [],
		})
		const british = await spellingIssues(parse(text), text, {
			language: 'en-GB',
			dictionary: BRITISH,
			ignoreWords: [],
		})

		expect(american.map((issue) => issue.actual)).toEqual(['colour'])
		expect(british).toEqual([])
	})

	it('accepts a word on the ignore list', async () => {
		const text = 'The tiptap schema is fine.'

		const issues = await spellingIssues(parse(text), text, {
			language: 'en-US',
			dictionary: AMERICAN,
			ignoreWords: ['Tiptap'],
		})

		// Matched case-insensitively: a word added at the start of a sentence
		// should not have to be added again in the middle of one.
		expect(issues).toEqual([])
	})

	it('reuses the dictionary it was given for a language', async () => {
		const text = 'We recieved it.'

		const issues = await spellingIssues(parse(text), text, {
			language: 'en-US',
			ignoreWords: [],
		})

		// No dictionary passed: the processor built by an earlier test in this
		// file is still cached, which is what keeps a ~500kB word list from being
		// parsed again on every keystroke.
		expect(issues.map((issue) => issue.actual)).toEqual(['recieved'])
	})

	it('still suggests corrections after a long session of unknown words', async () => {
		// `retext-spell`'s `max` is a budget on state created when the plugin is
		// attached, so the cached processor spent it once for the whole worker.
		// At its default of 30 the panel stopped offering corrections about a
		// minute into typing - every half-typed word spends a unit of it.
		//
		// Words that look like English rather than gibberish: nspell's search
		// widens the further a word sits from anything real, so gibberish costs
		// ~200ms each against ~15ms for a plausible misspelling.
		const unknown = [
			'mispelaing',
			'mispelbing',
			'mispelcing',
			'mispelding',
			'mispeleing',
			'mispelfing',
			'mispelging',
			'mispelhing',
			'mispeliing',
			'mispeljing',
			'mispelking',
			'mispelling',
			'mispelming',
			'mispelning',
			'mispeloing',
			'mispelping',
			'mispelqing',
			'mispelring',
			'mispelsing',
			'mispelting',
			'mispeluing',
			'mispelving',
			'mispelwing',
			'mispelxing',
			'mispelying',
			'mispelzing',
			'typografay',
			'typografby',
			'typografcy',
			'typografdy',
			'typografey',
			'typograffy',
			'typografgy',
			'typografhy',
			'typografiy',
			'typografjy',
		]

		for (const word of unknown) {
			const noise = `The ${word} word.`
			await spellingIssues(parse(noise), noise, {
				language: 'en-US',
				dictionary: AMERICAN,
				ignoreWords: [],
			})
		}

		const text = 'We recieved the report.'
		const issues = await spellingIssues(parse(text), text, {
			language: 'en-US',
			dictionary: AMERICAN,
			ignoreWords: [],
		})

		expect(issues[0].expected).toContain('received')
	})

	it('explains itself when a language it has never seen arrives without one', async () => {
		const text = 'We recieved it.'

		await expect(
			spellingIssues(parse(text), text, {
				language: 'en-AU',
				ignoreWords: [],
			})
		).rejects.toThrow('No en-AU dictionary has been supplied')
	})
})
