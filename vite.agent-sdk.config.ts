import { join } from 'node:path'

import { defineConfig } from 'vite'

// Real ESM, not CJS: the SDK itself calls `createRequire(import.meta.url)`,
// which only resolves correctly when `import.meta.url` survives untouched -
// true for Rollup/Rolldown's `es` output, unlike a `cjs` target, which would
// need to shim it to an empty value.
export default defineConfig({
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
