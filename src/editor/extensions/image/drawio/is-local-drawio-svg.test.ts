import { describe, expect, it } from 'vitest'

import { isLocalDrawioSvg } from '#src/editor/extensions/image/drawio/is-local-drawio-svg'

describe('isLocalDrawioSvg', () => {
	it.each([
		'arch.drawio.svg',
		'./diagrams/arch.drawio.svg',
		'ARCH.DRAWIO.SVG',
		'arch.drawio.svg?v=2',
	])('recognises %s', (src) => {
		expect(isLocalDrawioSvg(src)).toBe(true)
	})

	it.each([
		'https://example.com/arch.drawio.svg',
		'data:image/svg+xml;base64,AAAA',
		'file:///tmp/arch.drawio.svg',
	])('does not recognise the remote %s the webview cannot fetch', (src) => {
		expect(isLocalDrawioSvg(src)).toBe(false)
	})

	it.each(['arch.svg', 'arch.drawio', 'arch.drawio.png', 'drawio.svg.png', ''])(
		'does not recognise %s',
		(src) => {
			expect(isLocalDrawioSvg(src)).toBe(false)
		}
	)
})
