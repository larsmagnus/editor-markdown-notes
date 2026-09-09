import { join } from 'node:path'

import { defineConfig } from 'vite'

import { subpathAlias } from './vite/subpath-alias'

const srcRoot = join(import.meta.dirname, 'src')

/**
 * Bundles the MCP server as a standalone Node process outside the
 * `--no-dependencies` `.vsix`, so it has to carry its own full dependency
 * graph (the retext stack, hunspell dictionaries) rather than assume
 * anything is already installed. `server.ts` and `copy-dictionaries.ts` are
 * unrelated entries here that both ship as standalone Node ESM.
 */
export default defineConfig({
	// Not a webview build - don't copy `public/`'s assets into the output.
	publicDir: false,
	resolve: { alias: subpathAlias() },
	// `build.ssr: true` alone externalizes every dependency, assuming a real
	// `node_modules` sits next to the output. There isn't one.
	ssr: { noExternal: true },
	build: {
		ssr: true,
		minify: true,
		outDir: 'out/mcp',
		emptyOutDir: false,
		rollupOptions: {
			input: {
				server: join(srcRoot, 'mcp/server.ts'),
				'copy-dictionaries': join(srcRoot, 'mcp/copy-dictionaries.ts'),
			},
			external: ['vscode'],
			output: {
				format: 'es',
				entryFileNames: '[name].mjs',
				// A bare `.js` shared chunk would read as CommonJS under
				// `out/package.json`'s sentinel, breaking its own ESM syntax.
				chunkFileNames: 'assets/[name]-[hash].mjs',
			},
		},
	},
})
