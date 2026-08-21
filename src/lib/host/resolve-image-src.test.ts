import { describe, expect, it } from 'vitest'

import { resolveImageSrc } from '@/lib/host/resolve-image-src'

// What `webview.asWebviewUri` hands back for a document in a workspace.
const baseUris = {
	document: 'https://file+.vscode-resource.vscode-cdn.net/Users/dev/notes/docs',
	workspace: 'https://file+.vscode-resource.vscode-cdn.net/Users/dev/notes',
}

describe('resolveImageSrc in a VSCode webview', () => {
	it('resolves a bare relative path against the document folder', () => {
		expect(resolveImageSrc('diagram.png', baseUris)).toBe(
			`${baseUris.document}/diagram.png`
		)
	})

	it('resolves an explicitly relative path against the document folder', () => {
		expect(resolveImageSrc('./diagram.png', baseUris)).toBe(
			`${baseUris.document}/diagram.png`
		)
	})

	it('walks up out of the document folder', () => {
		expect(resolveImageSrc('../assets/diagram.png', baseUris)).toBe(
			`${baseUris.workspace}/assets/diagram.png`
		)
	})

	it('resolves a leading slash against the workspace root, not the server root', () => {
		expect(resolveImageSrc('/assets/diagram.png', baseUris)).toBe(
			`${baseUris.workspace}/assets/diagram.png`
		)
	})

	it('encodes spaces in the path', () => {
		expect(resolveImageSrc('my diagram.png', baseUris)).toBe(
			`${baseUris.document}/my%20diagram.png`
		)
	})

	it('leaves absolute URLs and data URIs alone', () => {
		expect(resolveImageSrc('https://example.com/x.png', baseUris)).toBe(
			'https://example.com/x.png'
		)
		expect(resolveImageSrc('data:image/png;base64,AAAA', baseUris)).toBe(
			'data:image/png;base64,AAAA'
		)
	})
})

describe('resolveImageSrc outside VSCode', () => {
	it('leaves the path untouched when there are no bases', () => {
		expect(resolveImageSrc('/icon-editor-markdown-notes.png', undefined)).toBe(
			'/icon-editor-markdown-notes.png'
		)
		expect(resolveImageSrc('./diagram.png', undefined)).toBe('./diagram.png')
	})
})
