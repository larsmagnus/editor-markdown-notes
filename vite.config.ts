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
		alias: {
			'@': `${import.meta.dirname}/src`,
		},
	},
	test: {
		environment: 'happy-dom',
		setupFiles: ['./src/test-setup.ts'],
		include: ['src/**/*.test.{ts,tsx}'],
		// src/test holds the @vscode/test-electron suite, run by `pnpm test:extension`
		exclude: [...configDefaults.exclude, 'src/test/**'],
	},
})
