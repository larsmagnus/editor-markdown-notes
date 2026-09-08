import type { HunspellDictionary } from '#src/lib/text-tools/types'
import type { SpellingLanguage } from '#src/shared/messages'

/**
 * Fetches the Hunspell dictionary behind a spelling language.
 *
 * A table of `import()` thunks rather than a switch, so each language is its own
 * lazily-fetched chunk (~575kB of text each) and only the one in use is ever
 * loaded. Main thread only: the worker is inlined into a blob, where a dynamic
 * import would resolve against the blob URL rather than the extension, so the
 * bytes have to be loaded out here and posted in.
 */
const LOADERS: Record<
	SpellingLanguage,
	() => Promise<{ default: HunspellDictionary }>
> = {
	'en-US': () => import('#src/lib/text-tools/dictionaries/en-us'),
	'en-GB': () => import('#src/lib/text-tools/dictionaries/en-gb'),
	'en-AU': () => import('#src/lib/text-tools/dictionaries/en-au'),
}

export async function loadDictionary(
	language: SpellingLanguage
): Promise<HunspellDictionary> {
	const module = await LOADERS[language]()

	return module.default
}
