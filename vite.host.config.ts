import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

import { defineConfig } from 'vite'

const srcRoot = join(import.meta.dirname, 'src')

/**
 * Every host source file, as a `{ out/-relative path: absolute .ts path }`
 * entry map - the same file set `tsconfig.host.json`'s `include`/`exclude`
 * names.
 *
 * One Rollup entry per file, not one entry at `host.ts`, because
 * `.vscode-test.mjs` globs `out/test/**\/*.test.js` directly (mocha's own
 * discovery model, unrelated to what `host.ts` imports) and `src/test/**`
 * imports individual host modules directly for whitebox coverage - both need
 * every file to keep existing as its own requirable output, which is what
 * `output.preserveModules` below does with this entry map.
 */
function hostEntries(): Record<string, string> {
	const entries: Record<string, string> = { host: join(srcRoot, 'host.ts') }

	for (const dir of ['host', 'shared', 'test', 'lib/host']) {
		const absDir = join(srcRoot, dir)
		for (const file of readdirSync(absDir, { recursive: true })) {
			if (typeof file !== 'string' || !file.endsWith('.ts')) continue
			const absFile = join(absDir, file)
			if (absFile.endsWith('agent-sdk-bundle.ts')) continue
			// `*.test.ts` under these three is vitest coverage that `tsconfig.app.json`
			// already runs from `src/` directly - `tsc` compiled it into `out/` too
			// as a harmless side effect of its broad `include`, but nothing ever ran
			// it from there, and bundling it for real (unlike `tsc`) would pull the
			// actual `vitest`/`chai` packages into the output. `src/test/**` is
			// different: `.vscode-test.mjs` genuinely globs `out/test/**/*.test.js`.
			if (dir !== 'test' && absFile.endsWith('.test.ts')) continue

			const key = relative(srcRoot, absFile).replace(/\.ts$/, '')
			entries[key] = absFile
		}
	}

	return entries
}

export default defineConfig({
	// Not a webview build - don't copy `public/`'s assets into the output.
	publicDir: false,
	resolve: {
		// Mirrors `vite.config.ts`'s alias - Rollup/Rolldown doesn't resolve the
		// root `package.json`'s `imports` field on its own.
		alias: [{ find: /^#src\//, replacement: `${srcRoot}/` }],
	},
	build: {
		ssr: true,
		// Vite defaults `minify` to off for SSR builds; this is what actually
		// ships in the .vsix, so opt back in explicitly.
		minify: true,
		outDir: 'out',
		emptyOutDir: false,
		sourcemap: true,
		// This is a Node CJS build, not a browser app - the modulepreload
		// polyfill Vite otherwise injects assumes `import.meta`, which is empty
		// under `cjs` output and produces a broken, noisy chunk.
		modulePreload: false,
		rollupOptions: {
			input: hostEntries(),
			// `load-agent-sdk.cjs` is hand-written, not `tsc`/Rollup output - see its
			// own comment - and `claude-agent.ts`'s `require('./load-agent-sdk.cjs')`
			// must reach it unbundled. `vscode:bundle-agent-sdk` copies it to
			// `out/host/` verbatim, alongside the file that requires it.
			external: (id) => id === 'vscode' || id.endsWith('load-agent-sdk.cjs'),
			// Every entry's real consumer is outside this bundle's graph entirely -
			// VS Code calls `host.js`'s `activate`/`deactivate`, mocha requires each
			// `test/*.test.js`, `src/test/**` imports individual host modules
			// directly. Rollup can't see any of that and drops "unused" exports
			// without this.
			preserveEntrySignatures: 'strict',
			output: {
				format: 'cjs',
				preserveModules: true,
				preserveModulesRoot: srcRoot,
				entryFileNames: '[name].js',
			},
		},
	},
})
