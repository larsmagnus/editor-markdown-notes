import path from 'path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	// Relative, so chunks resolve against the loading module's URL. The VSCode
	// webview serves `dist/` from a `vscode-webview://…` URI, where root-absolute
	// asset paths point outside the extension.
	base: './',
	build: {
		// Written to `dist/manifest.json` rather than the default
		// `dist/.vite/manifest.json`: the extension host reads it to find the
		// entry chunk, and a dot-directory is one more thing to get past `vsce`.
		manifest: 'manifest.json',
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	test: {
		environment: 'happy-dom',
		setupFiles: ['./src/test-setup.ts'],
		include: ['src/**/*.test.{ts,tsx}'],
		// src/test holds the @vscode/test-electron suite, run by `pnpm test:extension`
		exclude: [...configDefaults.exclude, 'src/test/**'],
	},
})
