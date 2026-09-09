import { join } from 'node:path'

import { defineConfig } from 'vite'

/**
 * Bundles the Claude Agent SDK on its own, as real ESM - it calls
 * `createRequire(import.meta.url)`, which a `cjs` target would shim to an
 * empty value. A hand-written loader dynamically `import()`s this from the
 * CJS host.
 */
export default defineConfig({
	// Not a webview build - don't copy `public/`'s assets into the output.
	publicDir: false,
	// No alias needed - the entry is a one-line re-export with no imports.
	ssr: { noExternal: true },
	build: {
		ssr: true,
		minify: true,
		outDir: 'out/host',
		emptyOutDir: false,
		rollupOptions: {
			input: {
				'agent-sdk-bundle': join(
					import.meta.dirname,
					'src/host/agent-sdk-bundle.ts'
				),
			},
			external: ['vscode'],
			output: {
				format: 'es',
				entryFileNames: '[name].mjs',
			},
		},
	},
})
