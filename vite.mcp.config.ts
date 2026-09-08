import { join } from 'node:path'

import { defineConfig } from 'vite'

const srcRoot = join(import.meta.dirname, 'src')

// `server.ts` and `copy-dictionaries.ts` are unrelated entries (the latter
// never imports the former) that both need to ship as standalone Node ESM -
// this MCP server is its own process, run outside VS Code's `--no-dependencies`
// `.vsix`, so unlike the webview it has to carry its own dependency graph
// (the retext stack, hunspell dictionaries) rather than assume anything is
// already installed.
export default defineConfig({
	resolve: {
		// Mirrors `vite.config.ts`'s alias - Rollup/Rolldown doesn't resolve the
		// root `package.json`'s `imports` field on its own.
		alias: [{ find: /^#src\//, replacement: `${srcRoot}/` }],
	},
	// `build.ssr: true` alone leaves Vite's SSR default in place: externalize
	// every `node_modules` dependency, assuming a real `node_modules` sits
	// alongside the output at runtime. There isn't one - the `.vsix` ships with
	// `--no-dependencies` - so every dependency has to be bundled in for real.
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
				// A shared chunk (e.g. the dictionary list both entries import)
				// defaults to a bare `.js` extension, which `out/package.json`'s
				// `"type":"commonjs"` sentinel makes Node treat as CommonJS - breaking
				// its own ESM `import`/`export` syntax at runtime.
				chunkFileNames: 'assets/[name]-[hash].mjs',
			},
		},
	},
})
