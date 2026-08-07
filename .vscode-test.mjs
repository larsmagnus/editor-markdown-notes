import { defineConfig } from '@vscode/test-cli'

export default defineConfig({
	files: 'out/test/**/*.test.js',
	// The image tests need a workspace root to resolve root-absolute paths
	// against, and the repo is the workspace the sample notes were written for.
	workspaceFolder: '.',
})
