import { join } from 'node:path'

import { defineConfig } from 'vite'

/**
 * Bundles the Claude Agent SDK on its own - it needs to load as real ESM
 * even though the host itself is CJS, since the SDK calls
 * `createRequire(import.meta.url)`, which only resolves correctly when
 * `import.meta.url` survives untouched (true for Rollup/Rolldown's `es`
 * output, unlike a `cjs` target, which would shim it to an empty value).
 * `load-agent-sdk.cjs` is what dynamically `import()`s this bundle from the
 * CJS host.
 */
export default defineConfig({
	// Not a webview build - don't copy `public/`'s assets into the output.
	publicDir: false,
	// No `resolve.alias` needed - this is a one-line re-export
	// (`src/host/agent-sdk-bundle.ts`) with no `#src/*` imports of its own.
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
