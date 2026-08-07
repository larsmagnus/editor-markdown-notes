import path from 'path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { configDefaults, defineConfig } from 'vitest/config'

/**
 * Vendor chunks, keyed by the package a module belongs to. Anything not listed
 * stays in the entry chunk.
 */
const VENDOR_CHUNKS: Record<string, readonly string[]> = {
	react: ['react', 'react-dom', 'scheduler'],
	// ProseMirror is the layer under TipTap and versions independently of it,
	// so the two are worth caching separately.
	prosemirror: ['prosemirror-', 'orderedmap', 'rope-sequence', 'w3c-keyname'],
	editor: [
		'@tiptap',
		'tiptap-markdown',
		'markdown-it',
		'entities',
		'linkify-it',
		'mdurl',
		'punycode.js',
		'uc.micro',
	],
	radix: ['@radix-ui'],
}

/**
 * The package a module id belongs to. pnpm ids carry the version in a
 * `.pnpm/@tiptap+core@2.23.0_…` segment, so only the part after the *last*
 * `node_modules/` describes the package.
 */
function getPackageName(id: string): string | undefined {
	const parts = id.split('node_modules/')
	if (parts.length < 2) return undefined

	return parts[parts.length - 1]
}

function manualChunks(id: string): string | undefined {
	const packageName = getPackageName(id)
	if (!packageName) return undefined

	for (const [chunk, packages] of Object.entries(VENDOR_CHUNKS)) {
		// A trailing `-` marks a family of packages (`prosemirror-view`,
		// `prosemirror-state`, …); everything else names one package exactly.
		const belongs = packages.some((name) =>
			name.endsWith('-')
				? packageName.startsWith(name)
				: packageName.startsWith(`${name}/`)
		)

		if (belongs) return chunk
	}

	return undefined
}

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
		rollupOptions: {
			output: { manualChunks },
		},
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
