import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)

/**
 * Makes each Hunspell dictionary's `.aff`/`.dic` importable as `?raw` text.
 *
 * The `dictionary-*` packages are written for Node: their entry point is a
 * top-level `await fs.readFile`, and their `exports` field is a bare string,
 * which blocks `dictionary-en/index.dic` as a subpath. Resolving the entry -
 * the one specifier `exports` does allow - and aliasing its siblings is what
 * gets the bytes into a browser build. Absolute, because pnpm's symlinked
 * layout puts the real files somewhere no repo-relative path reaches.
 */
export function dictionaryAliases(): { find: RegExp; replacement: string }[] {
	const packages = ['dictionary-en', 'dictionary-en-gb', 'dictionary-en-au']

	return packages.flatMap((name) =>
		[
			['aff', 'index.aff'],
			['dic', 'index.dic'],
		].map(([specifier, file]) => ({
			// The trailing group keeps `?raw` attached. An exact-string alias never
			// matches at all, because the query is part of the id Rolldown resolves.
			find: new RegExp(`^${name}/${specifier}(\\?.*)?$`),
			replacement: `${join(dirname(require.resolve(name)), file)}$1`,
		}))
	)
}
