import type { HunspellDictionary } from '#src/lib/text-tools/types'

/**
 * Appends a technical wordlist to a Hunspell dictionary's `.dic` string, as
 * bare entries with no affix flags - each term is already the inflected form
 * a document would use (`typesafe`, not a base form plus a suffix rule).
 *
 * A Hunspell `.dic` opens with a line giving its own word count, which has to
 * grow by however many terms are appended or `nspell` mis-parses the file.
 */
export function mergeTechnicalTerms(
	dictionary: HunspellDictionary,
	words: string[]
): HunspellDictionary {
	if (words.length === 0) return dictionary

	const newline = dictionary.dic.includes('\r\n') ? '\r\n' : '\n'
	const [countLine, ...rest] = dictionary.dic
		.split(newline)
		.filter((line) => line.length > 0)
	const count = Number.parseInt(countLine ?? '0', 10)

	const dic = [String(count + words.length), ...rest, ...words].join(newline)

	return { ...dictionary, dic }
}
