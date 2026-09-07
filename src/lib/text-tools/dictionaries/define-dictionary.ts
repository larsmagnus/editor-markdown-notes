import type { HunspellDictionary } from '@/lib/text-tools/types'

/**
 * One language's Hunspell pair, as text rather than bytes.
 *
 * Each language stays its own module so that Vite emits it as a chunk of its
 * own - only the language in use is ever fetched - which is also why the `?raw`
 * imports have to sit there as literals rather than being resolved here. `?raw`
 * gives strings, which is what nspell's constructor wants: handed a
 * `Uint8Array` it falls through to stringifying the byte array, and every word
 * then reads as a misspelling.
 */
export function defineDictionary(aff: string, dic: string): HunspellDictionary {
	return { aff, dic }
}
