import { describe, expect, it } from 'vitest'

import { buildContentSecurityPolicy } from '@/lib/content-security-policy'

const CSP_SOURCE = 'https://file+.vscode-resource.vscode-cdn.net'

/** Splits the policy the way a browser does, so directives can be read back. */
function directives(policy: string) {
	return new Map(
		policy.split('; ').map((directive) => {
			const [name, ...values] = directive.split(' ')
			return [name, values]
		})
	)
}

describe('buildContentSecurityPolicy', () => {
	it('denies everything not explicitly allowed', () => {
		const policy = directives(buildContentSecurityPolicy(CSP_SOURCE, 'abc123'))

		expect(policy.get('default-src')).toEqual([`'none'`])
	})

	/**
	 * The nonce on the entry script is not inherited by the modules it imports,
	 * so the vendor chunks and the on-demand mermaid bundles need `cspSource` too.
	 */
	it('allows scripts by nonce and by resource host', () => {
		const policy = directives(buildContentSecurityPolicy(CSP_SOURCE, 'abc123'))

		expect(policy.get('script-src')).toEqual([`'nonce-abc123'`, CSP_SOURCE])
	})

	/** A rendered diagram carries its own `<style>` inside the SVG. */
	it('allows the inline styles a mermaid diagram draws with', () => {
		const policy = directives(buildContentSecurityPolicy(CSP_SOURCE, 'abc123'))

		expect(policy.get('style-src')).toEqual([CSP_SOURCE, `'unsafe-inline'`])
	})

	it('allows images from the resource host, over https and as data URIs', () => {
		const policy = directives(buildContentSecurityPolicy(CSP_SOURCE, 'abc123'))

		expect(policy.get('img-src')).toEqual([CSP_SOURCE, 'https:', 'data:'])
	})

	it('allows fonts from the resource host and as data URIs', () => {
		const policy = directives(buildContentSecurityPolicy(CSP_SOURCE, 'abc123'))

		expect(policy.get('font-src')).toEqual([CSP_SOURCE, 'data:'])
	})

	it('allows connections to the resource host', () => {
		const policy = directives(buildContentSecurityPolicy(CSP_SOURCE, 'abc123'))

		expect(policy.get('connect-src')).toEqual([CSP_SOURCE])
	})

	/**
	 * A worker must be same-origin, and `cspSource` is a different origin from the
	 * `vscode-webview://` document. Vite inlines the analyser and boots it from a
	 * blob URL, which inherits the document's origin — so `blob:` is what makes
	 * the text tools start at all.
	 */
	it('allows the text tools worker to boot from a blob URL', () => {
		const policy = directives(buildContentSecurityPolicy(CSP_SOURCE, 'abc123'))

		expect(policy.get('worker-src')).toEqual(['blob:'])
	})

	it('carries the nonce it was given', () => {
		const policy = buildContentSecurityPolicy(CSP_SOURCE, 'a-different-nonce')

		expect(policy).toContain(`'nonce-a-different-nonce'`)
	})
})
