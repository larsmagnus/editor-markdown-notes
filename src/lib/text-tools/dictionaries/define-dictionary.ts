import { mergeTechnicalTerms } from '#src/lib/text-tools/dictionaries/technical-terms'
import { TECHNICAL_TERMS } from '#src/lib/text-tools/dictionaries/technical-terms.generated'
import type { HunspellDictionary } from '#src/lib/text-tools/types'

/**
 * One language's Hunspell pair, as text rather than bytes.
 *
 * Each language stays its own module so that Vite emits it as a chunk of its
 * own - only the language in use is ever fetched - which is also why the `?raw`
 * imports have to sit there as literals rather than being resolved here. `?raw`
 * gives strings, which is what nspell's constructor wants: handed a
 * `Uint8Array` it falls through to stringifying the byte array, and every word
 * then reads as a misspelling.
 *
 * The technical-terms wordlist is spliced in here rather than per-language,
 * since all three languages this ships (`en-US`/`en-GB`/`en-AU`) are English
 * variants it applies to unconditionally.
 */
export function defineDictionary(aff: string, dic: string): HunspellDictionary {
	return mergeTechnicalTerms({ aff, dic }, TECHNICAL_TERMS)
}
