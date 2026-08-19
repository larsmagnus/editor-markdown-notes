import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import type { Plugin } from 'vite'
import { configDefaults, defineConfig } from 'vitest/config'

/** The half of pluralize's UMD guard that Rolldown cannot satisfy. */
const PLURALIZE_NODE_GUARD = "typeof require === 'function' && "

/**
 * Restores `pluralize`'s CommonJS export under Rolldown.
 *
 * The package is a UMD bundle that only assigns `module.exports` when
 * `typeof require === 'function'`. Rolldown defines a `require` stub when it
 * pre-bundles for dev but not in a production build, so there the factory falls
 * through to its browser-global branch and the module resolves to
 * `{ pluralize }` rather than the function itself - `syllable` then throws
 * inside the text tools worker, taking every readability check with it. What is
 * left of the guard holds under both the dev prebundle and the built CJS
 * wrapper.
 */
function fixPluralizeUmd(): Plugin {
	return {
		name: 'fix-pluralize-umd',
		transform(code, id) {
			if (!id.endsWith('/pluralize/pluralize.js')) return null
			if (!code.includes(PLURALIZE_NODE_GUARD)) {
				throw new Error(
					'pluralize no longer guards its CommonJS export on `typeof require` - drop fixPluralizeUmd from vite.config.ts.'
				)
			}

			return code.replace(PLURALIZE_NODE_GUARD, '')
		},
	}
}

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
function dictionaryAliases(): { find: RegExp; replacement: string }[] {
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

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	// Registered here rather than in `plugins`: the worker is bundled by a build
	// of its own that the main plugins do not reach, and the analysis worker is
	// the only thing that pulls pluralize in at all.
	worker: {
		plugins: () => [fixPluralizeUmd()],
	},
	// Relative, so chunks resolve against the loading module's URL. The VSCode
	// webview serves `dist/` from a `vscode-webview://…` URI, where root-absolute
	// asset paths point outside the extension.
	base: './',
	build: {
		// Written to `dist/manifest.json` rather than the default
		// `dist/.vite/manifest.json`: the extension host reads it to find the
		// entry chunk, and a dot-directory is one more thing to get past `vsce`.
		manifest: 'manifest.json',
	},
	resolve: {
		alias: [
			{ find: /^@\//, replacement: `${import.meta.dirname}/src/` },
			...dictionaryAliases(),
		],
	},
	test: {
		environment: 'happy-dom',
		setupFiles: ['./src/test-setup.ts'],
		include: ['src/**/*.test.{ts,tsx}'],
		// src/test holds the @vscode/test-electron suite, run by `pnpm test:extension`
		exclude: [...configDefaults.exclude, 'src/test/**'],
	},
})
