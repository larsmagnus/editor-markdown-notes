import { readdirSync, readFileSync } from 'node:fs'
import { relative } from 'node:path'

import { defineConfig } from 'vite'

import { parseJsonc } from '#src/lib/host/jsonc'

const repoRoot = import.meta.dirname
const srcRoot = `${repoRoot}/src`

/**
 * Every file `tsconfig.host.json` includes, minus its vitest-only `*.test.ts`
 * files, as a `{ out/-relative path: absolute .ts path }` entry map.
 *
 * Reads `tsconfig.host.json`'s own `include` array rather than a second,
 * hand-kept directory list, so the two can't drift. One Rollup entry per
 * file, not one entry at `host.ts`, because both `.vscode-test.mjs` (globs
 * `out/test/**\/*.test.js` directly - mocha's own discovery, unrelated to
 * `host.ts`'s import graph) and `src/test/**` (imports individual host
 * modules directly for whitebox coverage) need every file to keep existing
 * as its own requirable output - what `output.preserveModules` below does
 * with this entry map.
 */
function hostEntries(): Record<string, string> {
	const { include } = parseJsonc(
		readFileSync(`${repoRoot}/tsconfig.host.json`, 'utf8')
	) as { include: string[] }

	const entries: Record<string, string> = {}
	const addFile = (absFile: string) => {
		// Its own `vite.agent-sdk.config.ts`, not this one - see that file.
		if (absFile.endsWith('agent-sdk-bundle.ts')) return
		// vitest coverage under host/**, shared/** that `tsconfig.app.json`
		// already runs from `src/` directly - `tsconfig.host.json` includes it
		// too as a side effect of its broad glob, but nothing ever runs it from
		// `out/`. `src/test/**` is the one directory where a `.test.ts` file is
		// real output: `.vscode-test.mjs` genuinely globs it there.
		if (absFile.endsWith('.test.ts') && !absFile.includes('/src/test/')) return

		entries[relative(srcRoot, absFile).replace(/\.ts$/, '')] = absFile
	}

	for (const pattern of include) {
		const dir = pattern.match(/^(.*)\/\*\*\/\*$/)?.[1]
		if (!dir) {
			addFile(`${repoRoot}/${pattern}`)
			continue
		}
		for (const file of readdirSync(`${repoRoot}/${dir}`, { recursive: true })) {
			if (typeof file === 'string' && file.endsWith('.ts')) {
				addFile(`${repoRoot}/${dir}/${file}`)
			}
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
