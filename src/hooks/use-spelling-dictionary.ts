import { useEffect, useState } from 'react'

import { loadDictionary } from '@/lib/text-tools/load-dictionary'
import type { HunspellDictionary } from '@/lib/text-tools/types'
import type { SpellingLanguage } from '@/shared/messages'

type LoadedDictionary = {
	language: SpellingLanguage
	dictionary: HunspellDictionary
}

/**
 * Fetches the dictionary for a spelling language, once it is actually wanted.
 *
 * `dictionary` stays `undefined` until the chunk lands, and again for as long as
 * a language switch is in flight - checking American text against a British
 * dictionary for a frame would repaint every affected word, which reads as a
 * glitch rather than as loading. The caller drops the spelling rule meanwhile.
 *
 * `hasFailed` is the difference between that and a chunk that will never
 * arrive. Both leave the check finding nothing, so without it the panel would
 * show a ticked box quietly reporting no misspellings - the one outcome worse
 * than saying the dictionary could not be loaded.
 *
 * Separate from `use-text-tools.ts` so that the loading, the effect that
 * analyses, and the effect that tears the worker down stay three small things.
 */
export function useSpellingDictionary(
	language: SpellingLanguage,
	enabled: boolean
) {
	const [loaded, setLoaded] = useState<LoadedDictionary>()
	const [failedLanguage, setFailedLanguage] = useState<SpellingLanguage>()

	useEffect(() => {
		if (!enabled) return

		let cancelled = false

		loadDictionary(language)
			.then((dictionary) => {
				if (!cancelled) setLoaded({ language, dictionary })
			})
			.catch((error: unknown) => {
				// Reported as well as shown: the log bridge is what carries this to
				// the extension's output channel, where a blank-panel report starts.
				console.error(`Loading the ${language} dictionary failed:`, error)
				if (!cancelled) setFailedLanguage(language)
			})

		return () => {
			cancelled = true
		}
	}, [enabled, language])

	return {
		dictionary: loaded?.language === language ? loaded.dictionary : undefined,
		hasFailed: failedLanguage === language,
	}
}
