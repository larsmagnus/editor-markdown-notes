import dictionaryEn from 'dictionary-en'
import retextEnglish from 'retext-english'
import retextSpell from 'retext-spell'
import { unified } from 'unified'
import { VFile } from 'vfile'
import { describe, expect, it } from 'vitest'

import { mergeTechnicalTerms } from '#src/lib/text-tools/dictionaries/technical-terms'

/**
 * `retext-spell` types its dictionary as a pair of `Uint8Array`s, but nspell
 * reads them as strings - see the same cast in `spelling-issues.ts`.
 */
type SpellOptions = Parameters<typeof retextSpell>[0]

describe('mergeTechnicalTerms', () => {
	it('appends each term as a bare entry and bumps the leading count', () => {
		const dictionary = { aff: '', dic: '2\nfoo\nbar' }

		const result = mergeTechnicalTerms(dictionary, ['typesafe', 'subagent'])

		expect(result.dic).toBe('4\nfoo\nbar\ntypesafe\nsubagent')
	})

	it('returns the dictionary unchanged when the wordlist is empty', () => {
		const dictionary = { aff: '', dic: '1\nfoo' }

		expect(mergeTechnicalTerms(dictionary, [])).toEqual(dictionary)
	})

	it('makes nspell recognise a term the base dictionary rejects', async () => {
		const decoder = new TextDecoder()
		const base = {
			aff: decoder.decode(dictionaryEn.aff),
			dic: decoder.decode(dictionaryEn.dic),
		}

		const before = new VFile('typesafe')
		await unified()
			.use(retextEnglish)
			.use(retextSpell, base as unknown as SpellOptions)
			.run(unified().use(retextEnglish).parse(before), before)
		expect(before.messages.map((m) => m.actual)).toContain('typesafe')

		const merged = mergeTechnicalTerms(base, ['typesafe'])

		const after = new VFile('typesafe')
		await unified()
			.use(retextEnglish)
			.use(retextSpell, merged as unknown as SpellOptions)
			.run(unified().use(retextEnglish).parse(after), after)
		expect(after.messages).toEqual([])
	})
})
