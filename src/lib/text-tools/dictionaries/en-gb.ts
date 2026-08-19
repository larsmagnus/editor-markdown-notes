import aff from 'dictionary-en-gb/aff?raw'
import dic from 'dictionary-en-gb/dic?raw'

import type { HunspellDictionary } from '@/lib/text-tools/types'

/**
 * British English, as text rather than bytes.
 *
 * Its own module so that Vite emits it as a chunk of its own - only the language
 * in use is ever fetched. `?raw` gives strings, which is what nspell's
 * constructor wants: handed a `Uint8Array` it falls through to stringifying
 * the byte array, and every word then reads as a misspelling.
 */
const dictionary: HunspellDictionary = { aff, dic }

export default dictionary
