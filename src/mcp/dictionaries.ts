import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { HunspellDictionary } from '@/lib/text-tools/types'
import type { SpellingLanguage } from '@/shared/messages'

/**
 * Loads a Hunspell dictionary from the copy shipped beside this server.
 *
 * Copied into `out/mcp/dictionaries/` by the build rather than bundled into the
 * server: `vsce package --no-dependencies` ships no `node_modules`, and reading
 * the files at runtime keeps only the language actually asked for in memory -
 * the same per-language split the webview gets from its lazy chunks.
 *
 * Read as `utf8` **strings**, never bytes. `affix()` calls `doc.toString('utf8')`,
 * which on a `Uint8Array` returns `"104,101,…"` - no throw, just every word in
 * the note reported as misspelt.
 */
function directory(): string {
	// Overridable so the unit tests can point at a scratch copy: the real one is
	// a build artifact, and requiring a build before `vitest` would be a trap.
	return (
		process.env.EMN_DICTIONARY_DIR ??
		join(dirname(fileURLToPath(import.meta.url)), 'dictionaries')
	)
}

/**
 * What each language's dictionary is called once copied, and the package it
 * comes from. One table so the build and the runtime cannot disagree about a
 * filename - all three packages ship theirs as `index.aff`/`index.dic`, so the
 * rename here is the only thing keeping them apart on disk.
 */
export const DICTIONARIES: Record<
	SpellingLanguage,
	{ basename: string; package: string }
> = {
	'en-US': { basename: 'en-us', package: 'dictionary-en' },
	'en-GB': { basename: 'en-gb', package: 'dictionary-en-gb' },
	'en-AU': { basename: 'en-au', package: 'dictionary-en-au' },
}

const loaded = new Map<SpellingLanguage, HunspellDictionary>()

export function loadDictionary(language: SpellingLanguage): HunspellDictionary {
	const cached = loaded.get(language)
	if (cached) return cached

	const base = join(directory(), DICTIONARIES[language].basename)

	let dictionary: HunspellDictionary
	try {
		dictionary = {
			aff: readFileSync(`${base}.aff`, 'utf8'),
			dic: readFileSync(`${base}.dic`, 'utf8'),
		}
	} catch (error) {
		// Almost always a build that did not run `copy-dictionaries`, which reads
		// as an unrelated `ENOENT` on a file nobody wrote by hand.
		throw new Error(
			`No ${language} dictionary at ${base}.aff/.dic - the build step that copies them has not run: ${
				error instanceof Error ? error.message : String(error)
			}`
		)
	}

	loaded.set(language, dictionary)

	return dictionary
}
