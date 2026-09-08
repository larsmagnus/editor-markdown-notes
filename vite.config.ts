import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

import { dictionaryAliases } from './vite/dictionary-aliases.ts'
import { fixPluralizeUmd } from './vite/fix-pluralize-umd.ts'

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
		// Rolldown doesn't resolve the root `package.json`'s `imports` field on its
		// own, unlike Node and `tsc` - `#src/*` still needs a manual alias here.
		alias: [
			{ find: /^#src\//, replacement: `${import.meta.dirname}/src/` },
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
