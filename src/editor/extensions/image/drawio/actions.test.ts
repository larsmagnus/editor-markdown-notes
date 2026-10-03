import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { copyDrawioSvgAsMermaid } from '#src/editor/extensions/image/drawio/actions'
import {
	drawioFile,
	drawioSvg,
} from '#src/editor/extensions/image/drawio/drawio-fixtures'
import { copyToClipboard } from '#src/lib/clipboard'

vi.mock('#src/lib/clipboard', () => ({ copyToClipboard: vi.fn() }))

const FLOWCHART = drawioSvg(
	drawioFile([
		{ id: 'a', value: 'Start' },
		{ id: 'b', value: 'Done', x: 200 },
		{ id: 'e', source: 'a', target: 'b' },
	])
)

function serve(body: string, ok = true) {
	vi.stubGlobal(
		'fetch',
		vi.fn(async () => new Response(body, { status: ok ? 200 : 404 }))
	)
}

beforeEach(() => {
	vi.mocked(copyToClipboard).mockResolvedValue(true)
})

afterEach(() => {
	vi.unstubAllGlobals()
	vi.restoreAllMocks()
	vi.clearAllMocks()
})

describe('copyDrawioSvgAsMermaid', () => {
	it('copies the diagram at the url as a mermaid flowchart', async () => {
		serve(FLOWCHART)
		const onCopied = vi.fn()

		await copyDrawioSvgAsMermaid('vscode-resource://arch.drawio.svg', onCopied)

		expect(fetch).toHaveBeenCalledWith('vscode-resource://arch.drawio.svg')
		expect(copyToClipboard).toHaveBeenCalledWith(
			['flowchart LR', '  n1["Start"]', '  n2["Done"]', '  n1 --> n2'].join(
				'\n'
			)
		)
		expect(onCopied).toHaveBeenCalledOnce()
	})

	it.each([
		['the file cannot be fetched', () => serve('missing', false)],
		[
			'the svg carries no diagram',
			() => serve('<svg xmlns="http://www.w3.org/2000/svg"/>'),
		],
		['the diagram has no nodes', () => serve(drawioSvg(drawioFile([])))],
	])('reports it and copies nothing when %s', async (_reason, arrange) => {
		arrange()
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
		const onCopied = vi.fn()

		await copyDrawioSvgAsMermaid('arch.drawio.svg', onCopied)

		expect(consoleError).toHaveBeenCalledOnce()
		expect(copyToClipboard).not.toHaveBeenCalled()
		expect(onCopied).not.toHaveBeenCalled()
	})

	it('does not claim a copy the clipboard refused', async () => {
		serve(FLOWCHART)
		vi.mocked(copyToClipboard).mockResolvedValue(false)
		const onCopied = vi.fn()

		await copyDrawioSvgAsMermaid('arch.drawio.svg', onCopied)

		expect(onCopied).not.toHaveBeenCalled()
	})
})
