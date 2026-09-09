import { readdirSync, readFileSync } from 'node:fs'
import { relative } from 'node:path'

import { defineConfig } from 'vite'

import { parseJsonc } from '#src/lib/host/jsonc'

import { subpathAlias } from './vite/subpath-alias'

const repoRoot = import.meta.dirname
const srcRoot = `${repoRoot}/src`

interface HostTsconfig {
	include: string[]
	exclude: string[]
}

/**
 * Every file `tsconfig.host.json` compiles, as a
 * `{ out/-relative path: absolute .ts path }` entry map.
 *
 * Reads `tsconfig.host.json`'s own `include`/`exclude` rather than a second,
 * hand-kept file list. One Rollup entry per file, not one entry at
 * `host.ts`: mocha and vitest both discover tests by requiring compiled
 * files directly, so every module needs to stay individually requirable -
 * `output.preserveModules` below is what does that.
 */
function hostEntries(): Record<string, string> {
	const { include, exclude } = parseJsonc(
		readFileSync(`${repoRoot}/tsconfig.host.json`, 'utf8')
	) as HostTsconfig
	const excludedFiles = new Set(
		exclude
			.filter((pattern) => !pattern.includes('*'))
			.map((pattern) => `${repoRoot}/${pattern}`)
	)

	const entries: Record<string, string> = {}
	const addFile = (absFile: string) => {
		if (excludedFiles.has(absFile)) return
		// Vitest-only coverage that `tsconfig.app.json` already runs from `src/`
		// directly - real build output only for `src/test/**`, which mocha
		// requires by file.
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

/**
 * Bundles and minifies the VS Code extension host.
 * `tsconfig.host.json --noEmit` still typechecks separately; this config
 * only emits.
 */
export default defineConfig({
	// Not a webview build - don't copy `public/`'s assets into the output.
	publicDir: false,
	resolve: { alias: subpathAlias() },
	build: {
		ssr: true,
		// Vite defaults `minify` off for SSR builds; this ships in the .vsix.
		minify: true,
		outDir: 'out',
		emptyOutDir: false,
		sourcemap: true,
		// The modulepreload polyfill assumes `import.meta`, which a `cjs` target
		// empties out.
		modulePreload: false,
		rollupOptions: {
			input: hostEntries(),
			// A hand-written loader for a sibling ESM chunk, not Rollup output.
			external: (id) => id === 'vscode' || id.endsWith('load-agent-sdk.cjs'),
			// Every entry's real consumer (VS Code, mocha, a whitebox test) is
			// outside this bundle's graph, so Rollup can't see the exports are
			// used and drops them without this.
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
