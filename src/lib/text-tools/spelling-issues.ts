import type { Root } from 'nlcst'
import retextEnglish from 'retext-english'
import retextSpell from 'retext-spell'
import { unified } from 'unified'
import { VFile } from 'vfile'

import type { HunspellDictionary, TextIssue } from '@/lib/text-tools/types'
import { toIssue } from '@/lib/text-tools/vfile-message-to-issue'
import type { SpellingLanguage } from '@/shared/messages'

/**
 * Its own pass rather than a plugin in `word-issues.ts`, which rebuilds its
 * processor every run: `retext-spell` hands its dictionary to nspell when the
 * plugin is attached, and parsing a ~500kB word list costs ~60ms that a keyed
 * cache pays once per language instead of on every keystroke.
 *
 * The cache is also what makes the suggestion budget in `buildProcessor` a
 * session-long one rather than a per-run one - read that before changing this.
 */
const processors = new Map<
	SpellingLanguage,
	ReturnType<typeof buildProcessor>
>()

/**
 * `retext-spell` types its dictionary as a pair of `Uint8Array`s, but nspell
 * reads them with `doc.toString('utf8')` - which on a `Uint8Array` returns
 * `"104,101,..."`, and every word in the document then reads as a misspelling.
 * Strings are what actually works, so the published type is the thing that is
 * wrong here, not the value.
 */
type SpellOptions = Parameters<typeof retextSpell>[0]

function buildProcessor(dictionary: HunspellDictionary) {
	// `max` is a budget on the plugin's own state, which is created when it is
	// attached and so - given the cache above - lasts the worker's whole life
	// rather than one run. Left at its default of 30, the panel would quietly
	// stop offering corrections a minute into typing, since every half-typed
	// word spends a unit of it. Lifting it is safe because `retext-spell`
	// memoises suggestions per word: an unknown word costs one `suggest()` for
	// the life of the processor, not one per analysis.
	const options = {
		dictionary,
		max: Number.POSITIVE_INFINITY,
	} as unknown as SpellOptions

	return unified().use(retextEnglish).use(retextSpell, options)
}

type SpellingOptions = {
	language: SpellingLanguage
	/** Required the first time a language is seen; ignored once it is cached. */
	dictionary?: HunspellDictionary
	ignoreWords: string[]
}

/**
 * `retext-spell` says so in a message of its own when it stops suggesting.
 * Unreachable while `max` is infinite, but kept because that message carries a
 * position: were the budget ever restored, it would draw a misspelling marker
 * over a perfectly-spelled word.
 */
const OVERFLOW_RULE_ID = 'overflow'

/** Misspelled words, against the dictionary for the chosen language. */
export async function spellingIssues(
	tree: Root,
	text: string,
	{ language, dictionary, ignoreWords }: SpellingOptions
): Promise<TextIssue[]> {
	const processor =
		processors.get(language) ??
		(dictionary ? buildProcessor(dictionary) : undefined)

	if (!processor) {
		throw new Error(`No ${language} dictionary has been supplied to the worker`)
	}

	processors.set(language, processor)

	const file = new VFile(text)
	await processor.run(tree, file)

	// Filtered here rather than passed as `retext-spell`'s own `ignore` option:
	// that option is read when the plugin is attached, so using it would rebuild
	// nspell - and pay for the word list again - every time the list changed.
	const ignored = new Set(ignoreWords.map((word) => word.toLowerCase()))

	return file.messages.flatMap((message) => {
		if (message.ruleId === OVERFLOW_RULE_ID) return []
		if (message.actual && ignored.has(message.actual.toLowerCase())) return []

		const issue = toIssue(message, 'misspelling')

		return issue ? [issue] : []
	})
}
