import { cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
	cancelPendingEchoes,
	liveEditor,
	mountWithEchoingHost,
	pause,
	placeCaretAfter,
	syncedTexts,
} from '#src/test-utils/echoing-host'
import type { Transform } from '#src/test-utils/echoing-host'

// The bubble menu positions itself with floating-ui, which measures the DOM and
// throws in happy-dom the moment anything moves the selection.
vi.mock('#src/components/menu-bubble', () => ({ MenuBubble: () => null }))

afterEach(() => {
	cancelPendingEchoes()
	cleanup()
	delete window.vscode
	delete window.initialContent
	delete window.fileName
	localStorage.clear()
	vi.clearAllMocks()
})

describe('typing while the host echoes each sync back', () => {
	describe.each<[string, Transform]>([
		['unchanged', (content) => content],
		[
			'with trailing whitespace trimmed',
			(content) => content.replace(/[ \t]+$/gm, ''),
		],
		['with CRLF line endings', (content) => content.replace(/\n/g, '\r\n')],
		[
			'reformatted elsewhere in the note',
			(content) => content.replace('* Later', '- Later'),
		],
	])('%s', (_name, transform) => {
		it('loses none of what was typed', async () => {
			const user = userEvent.setup()
			const postMessage = mountWithEchoingHost(
				'Ship it.\n\n* Later\n',
				transform
			)

			await placeCaretAfter('Ship it.')
			await user.keyboard(' Today.')
			// Past the first sync and its echo, still typing.
			await pause(1200)
			await user.keyboard(' Really.')

			await waitFor(
				() => {
					expect(syncedTexts(postMessage).at(-1)).toContain(
						'Ship it. Today. Really.'
					)
				},
				{ timeout: 3000 }
			)
			expect(liveEditor().textContent).toContain('Ship it. Today. Really.')
		})

		it('keeps blank lines typed with Enter', async () => {
			const user = userEvent.setup()
			mountWithEchoingHost('Ship it.\n\n* Later\n', transform)

			await placeCaretAfter('Ship it.')
			await user.keyboard('{Enter}{Enter}{Enter}')
			await pause(1500)

			const emptyParagraphs = [
				...liveEditor().querySelectorAll(':scope > p'),
			].filter((paragraph) => paragraph.textContent === '')
			// Three typed, plus the one the caret rests in after the list.
			expect(emptyParagraphs).toHaveLength(4)
		})
	})
})
