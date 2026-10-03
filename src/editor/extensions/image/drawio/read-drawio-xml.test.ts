import { deflateRawSync } from 'node:zlib'

import { describe, expect, it } from 'vitest'

import {
	drawioFile,
	drawioSvg,
} from '#src/editor/extensions/image/drawio/drawio-fixtures'
import { readDrawioXml } from '#src/editor/extensions/image/drawio/read-drawio-xml'

const FILE = drawioFile([{ id: 'a', value: 'Start' }])

describe('readDrawioXml', () => {
	it('reads an uncompressed file out of the svg', async () => {
		expect(await readDrawioXml(drawioSvg(FILE))).toContain('value="Start"')
	})

	it('inflates a compressed diagram', async () => {
		const model = FILE.match(/<mxGraphModel>.*<\/mxGraphModel>/)?.[0] ?? ''
		const payload = deflateRawSync(encodeURIComponent(model)).toString('base64')
		const compressed = `<mxfile><diagram id="d">${payload}</diagram></mxfile>`

		expect(await readDrawioXml(drawioSvg(compressed))).toContain(
			'value="Start"'
		)
	})

	it('has nothing to read in an ordinary svg', async () => {
		expect(
			await readDrawioXml('<svg xmlns="http://www.w3.org/2000/svg"/>')
		).toBeNull()
	})

	it('has nothing to read in a corrupt payload', async () => {
		const corrupt =
			'<mxfile><diagram id="d">!!!not-deflate!!!</diagram></mxfile>'

		expect(await readDrawioXml(drawioSvg(corrupt))).toBeNull()
	})
})
