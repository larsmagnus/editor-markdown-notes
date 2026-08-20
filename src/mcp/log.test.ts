import { afterEach, describe, expect, it, vi } from 'vitest'

import {
	describe as describeError,
	keepStdoutForProtocol,
	log,
} from '@/mcp/log'

/**
 * The server's stdout is the JSON-RPC transport, so these are protocol tests
 * dressed as logging ones: a line on the wrong stream desynchronises the
 * client, which shows up as a hang rather than as an error anyone can read.
 */
function captureStreams() {
	const stdout = vi
		.spyOn(process.stdout, 'write')
		.mockImplementation(() => true)
	const stderr = vi
		.spyOn(process.stderr, 'write')
		.mockImplementation(() => true)

	return { stdout, stderr }
}

afterEach(() => {
	vi.restoreAllMocks()
})

describe('log', () => {
	it('writes to stderr and never to stdout', () => {
		const { stdout, stderr } = captureStreams()

		log.info('analysis finished')
		log.warn('dictionary missing')
		log.error('tool failed')

		expect(stdout).not.toHaveBeenCalled()
		expect(stderr).toHaveBeenCalledTimes(3)
	})

	it('records the level so a failure is findable in the output view', () => {
		const { stderr } = captureStreams()

		log.error('check_markdown failed')

		expect(stderr.mock.calls[0]?.[0]).toContain('[error] check_markdown failed')
	})
})

describe('keepStdoutForProtocol', () => {
	it('sends a dependency console.log to stderr instead of the wire', () => {
		const original = console.log
		const { stdout, stderr } = captureStreams()

		try {
			keepStdoutForProtocol()
			console.log('chatty dependency')

			expect(stdout).not.toHaveBeenCalled()
			expect(stderr.mock.calls[0]?.[0]).toContain('chatty dependency')
		} finally {
			console.log = original
		}
	})
})

describe('describeError', () => {
	it('keeps the stack of a real error for the log', () => {
		expect(describeError(new Error('no dictionary'))).toContain('no dictionary')
	})

	it('survives something thrown that is not an error', () => {
		expect(describeError('plain string')).toBe('plain string')
	})
})
