import { join } from 'node:path'

import { defineConfig } from 'vite'

/**
 * Bundles every ESM-only dependency the extension host needs into its own
 * standalone chunk, loaded at runtime through `load-esm-bundle.cjs`'s dynamic
 * `import()`.
 *
 * VS Code's activation model requires the host itself to be CommonJS
 * (`vite.host.config.ts`'s own output), and the `.vsix` ships with
 * `--no-dependencies` - no `node_modules` at runtime, so nothing can fall
 * back to a plain `require()` resolving there either. That leaves no way to
 * merge in a dependency that only ships ESM: `@anthropic-ai/claude-agent-sdk`
 * calls `createRequire(import.meta.url)`, which a `cjs` output shims to
 * empty, and `pdfjs-dist` ships no CJS build at all, `.mjs` only, even for its
 * "legacy" Node entry. Pre-bundling each as its own real-ESM file and loading
 * it by path at runtime is what makes a CJS host able to reach either at all.
 *
 * One Rollup build, one entry per dependency: adding another is a line in
 * `input`, not a new config file.
 */
export default defineConfig({
	// Not a webview build - don't copy `public/`'s assets into the output.
	publicDir: false,
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
				'pdf-extractor-bundle': join(
					import.meta.dirname,
					'src/host/pdf-extractor-bundle.ts'
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
