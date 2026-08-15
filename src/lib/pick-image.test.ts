import { afterEach, describe, expect, it, vi } from 'vitest'

import { pickImage } from '@/lib/pick-image'

function bootInsideVSCode() {
	const postMessage = vi.fn()
	window.vscode = { postMessage, getState: vi.fn(), setState: vi.fn() }
	return postMessage
}

afterEach(() => {
	delete window.vscode
	vi.unstubAllGlobals()
})

describe('pickImage', () => {
	it('posts pickImage and resolves with the path the host replies with', async () => {
		const postMessage = bootInsideVSCode()

		const result = pickImage()
		expect(postMessage).toHaveBeenCalledWith({ type: 'pickImage' })

		window.dispatchEvent(
			new MessageEvent('message', {
				data: { type: 'imagePicked', path: './diagram.png' },
			})
		)

		expect(await result).toBe('./diagram.png')
	})

	it('resolves with null when the host reports the dialog was cancelled', async () => {
		bootInsideVSCode()

		const result = pickImage()
		window.dispatchEvent(
			new MessageEvent('message', {
				data: { type: 'imagePicked', path: null },
			})
		)

		expect(await result).toBeNull()
	})

	it('ignores unrelated messages while waiting for the reply', async () => {
		bootInsideVSCode()

		const result = pickImage()
		window.dispatchEvent(
			new MessageEvent('message', { data: { type: 'shikiTheme' } })
		)
		window.dispatchEvent(
			new MessageEvent('message', {
				data: { type: 'imagePicked', path: './diagram.png' },
			})
		)

		expect(await result).toBe('./diagram.png')
	})
})
