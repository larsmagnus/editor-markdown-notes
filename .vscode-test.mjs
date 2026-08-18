import { defineConfig } from '@vscode/test-cli'

export default defineConfig({
	files: 'out/test/**/*.test.js',
	// The image tests need a workspace root to resolve root-absolute paths
	// against, and the repo is the workspace the sample notes were written for.
	workspaceFolder: '.',
	// Keeps the search-reveal instrumentation exercised; it is inert without
	// this, so a real session pays nothing. Applies to the whole extension host
	// rather than one suite, which is why the probe reads matches the
	// clipboard-free way - see `docs/search-reveal-investigation.md`.
	env: { EMN_PROBE: '1' },
})
