import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { EMPTY_ANALYSIS, useAnalysis } from '#src/hooks/use-analysis'
import type { Analyzer } from '#src/lib/text-tools/analyze-client'
import type { Analysis } from '#src/lib/text-tools/types'

const THREE_SENTENCES: Analysis = { ...EMPTY_ANALYSIS, sentenceCount: 3 }
const FIVE_SENTENCES: Analysis = { ...EMPTY_ANALYSIS, sentenceCount: 5 }

type Deferred<T> = {
	promise: Promise<T>
	resolve: (value: T) => void
	reject: (error: Error) => void
}

function defer<T>(): Deferred<T> {
	let resolve!: (value: T) => void
	let reject!: (error: Error) => void
	const promise = new Promise<T>((res, rej) => {
		resolve = res
		reject = rej
	})
	return { promise, resolve, reject }
}

afterEach(() => {
	vi.restoreAllMocks()
})

describe('useAnalysis', () => {
	it('does nothing while the tools are off', () => {
		const pending: Deferred<Analysis>[] = []
		const analyzer: Analyzer = {
			analyze: vi.fn(() => {
				const call = defer<Analysis>()
				pending.push(call)
				return call.promise
			}),
			dispose: vi.fn(),
		}
		const getAnalyzer = vi.fn(async () => analyzer)
		const disposeAnalyzer = vi.fn()
		const { result } = renderHook(
			({ enabled, text, targetAge }) =>
				useAnalysis({
					getFlattenedText: () => ({ text }),
					revisionKey: text,
					enabled,
					rules: ['readability'],
					targetAge,
					spellingLanguage: 'en-US',
					spellingIgnoreWords: [],
					getAnalyzer,
					disposeAnalyzer,
				}),
			{ initialProps: { enabled: false, text: 'The cat sat.', targetAge: 12 } }
		)

		expect(getAnalyzer).not.toHaveBeenCalled()
		expect(result.current.analysis).toBe(EMPTY_ANALYSIS)
		expect(result.current.isAnalyzing).toBe(false)
	})

	it('reports analyzing until the worker answers, then pairs the result with the text it was found in', async () => {
		const pending: Deferred<Analysis>[] = []
		const analyzer: Analyzer = {
			analyze: vi.fn(() => {
				const call = defer<Analysis>()
				pending.push(call)
				return call.promise
			}),
			dispose: vi.fn(),
		}
		const getAnalyzer = vi.fn(async () => analyzer)
		const disposeAnalyzer = vi.fn()
		const { result } = renderHook(
			({ enabled, text, targetAge }) =>
				useAnalysis({
					getFlattenedText: () => ({ text }),
					revisionKey: text,
					enabled,
					rules: ['readability'],
					targetAge,
					spellingLanguage: 'en-US',
					spellingIgnoreWords: [],
					getAnalyzer,
					disposeAnalyzer,
				}),
			{ initialProps: { enabled: true, text: 'The cat sat.', targetAge: 12 } }
		)

		await waitFor(() => expect(pending).toHaveLength(1))
		expect(result.current.isAnalyzing).toBe(true)
		expect(analyzer.analyze).toHaveBeenCalledWith(
			'The cat sat.',
			expect.objectContaining({ rules: ['readability'], targetAge: 12 })
		)

		await act(async () => pending[0].resolve(THREE_SENTENCES))

		expect(result.current.isAnalyzing).toBe(false)
		expect(result.current.analysis).toBe(THREE_SENTENCES)
		expect(result.current.analyzedText).toEqual({ text: 'The cat sat.' })
	})

	it('analyses the new text when the revision moves on', async () => {
		const pending: Deferred<Analysis>[] = []
		const analyzer: Analyzer = {
			analyze: vi.fn(() => {
				const call = defer<Analysis>()
				pending.push(call)
				return call.promise
			}),
			dispose: vi.fn(),
		}
		const getAnalyzer = vi.fn(async () => analyzer)
		const disposeAnalyzer = vi.fn()
		const { rerender } = renderHook(
			({ enabled, text, targetAge }) =>
				useAnalysis({
					getFlattenedText: () => ({ text }),
					revisionKey: text,
					enabled,
					rules: ['readability'],
					targetAge,
					spellingLanguage: 'en-US',
					spellingIgnoreWords: [],
					getAnalyzer,
					disposeAnalyzer,
				}),
			{ initialProps: { enabled: true, text: 'The cat sat.', targetAge: 12 } }
		)

		await waitFor(() => expect(pending).toHaveLength(1))

		rerender({ enabled: true, text: 'The dog ran.', targetAge: 12 })

		await waitFor(() => expect(pending).toHaveLength(2))
		expect(analyzer.analyze).toHaveBeenLastCalledWith(
			'The dog ran.',
			expect.anything()
		)
	})

	it('analyses again when an option changes while enabled', async () => {
		const pending: Deferred<Analysis>[] = []
		const analyzer: Analyzer = {
			analyze: vi.fn(() => {
				const call = defer<Analysis>()
				pending.push(call)
				return call.promise
			}),
			dispose: vi.fn(),
		}
		const getAnalyzer = vi.fn(async () => analyzer)
		const disposeAnalyzer = vi.fn()
		const { rerender } = renderHook(
			({ enabled, text, targetAge }) =>
				useAnalysis({
					getFlattenedText: () => ({ text }),
					revisionKey: text,
					enabled,
					rules: ['readability'],
					targetAge,
					spellingLanguage: 'en-US',
					spellingIgnoreWords: [],
					getAnalyzer,
					disposeAnalyzer,
				}),
			{ initialProps: { enabled: true, text: 'The cat sat.', targetAge: 12 } }
		)

		await waitFor(() => expect(pending).toHaveLength(1))

		rerender({ enabled: true, text: 'The cat sat.', targetAge: 8 })

		await waitFor(() => expect(pending).toHaveLength(2))
		expect(analyzer.analyze).toHaveBeenLastCalledWith(
			'The cat sat.',
			expect.objectContaining({ targetAge: 8 })
		)
	})

	it('drops an answer for text the document has moved on from, and takes the newer one', async () => {
		const pending: Deferred<Analysis>[] = []
		const analyzer: Analyzer = {
			analyze: vi.fn(() => {
				const call = defer<Analysis>()
				pending.push(call)
				return call.promise
			}),
			dispose: vi.fn(),
		}
		const getAnalyzer = vi.fn(async () => analyzer)
		const disposeAnalyzer = vi.fn()
		const { result, rerender } = renderHook(
			({ enabled, text, targetAge }) =>
				useAnalysis({
					getFlattenedText: () => ({ text }),
					revisionKey: text,
					enabled,
					rules: ['readability'],
					targetAge,
					spellingLanguage: 'en-US',
					spellingIgnoreWords: [],
					getAnalyzer,
					disposeAnalyzer,
				}),
			{ initialProps: { enabled: true, text: 'The cat sat.', targetAge: 12 } }
		)

		await waitFor(() => expect(pending).toHaveLength(1))

		rerender({ enabled: true, text: 'The dog ran.', targetAge: 12 })
		await waitFor(() => expect(pending).toHaveLength(2))
		await act(async () => pending[0].resolve(THREE_SENTENCES))

		expect(result.current.analysis).toBe(EMPTY_ANALYSIS)
		expect(result.current.isAnalyzing).toBe(true)

		await act(async () => pending[1].resolve(FIVE_SENTENCES))

		expect(result.current.analysis).toBe(FIVE_SENTENCES)
		expect(result.current.analyzedText).toEqual({ text: 'The dog ran.' })
		expect(result.current.isAnalyzing).toBe(false)
	})

	it('forgets the last result and disposes the worker when switched off', async () => {
		const pending: Deferred<Analysis>[] = []
		const analyzer: Analyzer = {
			analyze: vi.fn(() => {
				const call = defer<Analysis>()
				pending.push(call)
				return call.promise
			}),
			dispose: vi.fn(),
		}
		const getAnalyzer = vi.fn(async () => analyzer)
		const disposeAnalyzer = vi.fn()
		const { result, rerender } = renderHook(
			({ enabled, text, targetAge }) =>
				useAnalysis({
					getFlattenedText: () => ({ text }),
					revisionKey: text,
					enabled,
					rules: ['readability'],
					targetAge,
					spellingLanguage: 'en-US',
					spellingIgnoreWords: [],
					getAnalyzer,
					disposeAnalyzer,
				}),
			{ initialProps: { enabled: true, text: 'The cat sat.', targetAge: 12 } }
		)

		await waitFor(() => expect(pending).toHaveLength(1))
		await act(async () => pending[0].resolve(THREE_SENTENCES))

		rerender({ enabled: false, text: 'The cat sat.', targetAge: 12 })

		expect(disposeAnalyzer).toHaveBeenCalled()
		expect(result.current.analysis).toBe(EMPTY_ANALYSIS)
		expect(result.current.analyzedText).toBeNull()
		expect(result.current.isAnalyzing).toBe(false)
	})

	it('stops reporting analyzing when switched off mid-run', async () => {
		const pending: Deferred<Analysis>[] = []
		const analyzer: Analyzer = {
			analyze: vi.fn(() => {
				const call = defer<Analysis>()
				pending.push(call)
				return call.promise
			}),
			dispose: vi.fn(),
		}
		const getAnalyzer = vi.fn(async () => analyzer)
		const disposeAnalyzer = vi.fn()
		const { result, rerender } = renderHook(
			({ enabled, text, targetAge }) =>
				useAnalysis({
					getFlattenedText: () => ({ text }),
					revisionKey: text,
					enabled,
					rules: ['readability'],
					targetAge,
					spellingLanguage: 'en-US',
					spellingIgnoreWords: [],
					getAnalyzer,
					disposeAnalyzer,
				}),
			{ initialProps: { enabled: true, text: 'The cat sat.', targetAge: 12 } }
		)

		await waitFor(() => expect(pending).toHaveLength(1))

		rerender({ enabled: false, text: 'The cat sat.', targetAge: 12 })
		await act(async () => pending[0].resolve(THREE_SENTENCES))

		expect(result.current.isAnalyzing).toBe(false)
		expect(result.current.analysis).toBe(EMPTY_ANALYSIS)
	})

	it('does not publish a result that lands after unmounting', async () => {
		const pending: Deferred<Analysis>[] = []
		const analyzer: Analyzer = {
			analyze: vi.fn(() => {
				const call = defer<Analysis>()
				pending.push(call)
				return call.promise
			}),
			dispose: vi.fn(),
		}
		const getAnalyzer = vi.fn(async () => analyzer)
		const disposeAnalyzer = vi.fn()
		const { unmount } = renderHook(
			({ enabled, text, targetAge }) =>
				useAnalysis({
					getFlattenedText: () => ({ text }),
					revisionKey: text,
					enabled,
					rules: ['readability'],
					targetAge,
					spellingLanguage: 'en-US',
					spellingIgnoreWords: [],
					getAnalyzer,
					disposeAnalyzer,
				}),
			{ initialProps: { enabled: true, text: 'The cat sat.', targetAge: 12 } }
		)

		await waitFor(() => expect(pending).toHaveLength(1))

		unmount()

		await expect(
			act(async () => pending[0].resolve(THREE_SENTENCES))
		).resolves.not.toThrow()
	})

	it('logs a failed run and stops reporting analyzing', async () => {
		const pending: Deferred<Analysis>[] = []
		const analyzer: Analyzer = {
			analyze: vi.fn(() => {
				const call = defer<Analysis>()
				pending.push(call)
				return call.promise
			}),
			dispose: vi.fn(),
		}
		const getAnalyzer = vi.fn(async () => analyzer)
		const disposeAnalyzer = vi.fn()
		const { result } = renderHook(
			({ enabled, text, targetAge }) =>
				useAnalysis({
					getFlattenedText: () => ({ text }),
					revisionKey: text,
					enabled,
					rules: ['readability'],
					targetAge,
					spellingLanguage: 'en-US',
					spellingIgnoreWords: [],
					getAnalyzer,
					disposeAnalyzer,
				}),
			{ initialProps: { enabled: true, text: 'The cat sat.', targetAge: 12 } }
		)

		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
		await waitFor(() => expect(pending).toHaveLength(1))

		await act(async () => pending[0].reject(new Error('worker crashed')))

		expect(consoleError).toHaveBeenCalledWith(
			'Text tools analysis failed:',
			expect.objectContaining({ message: 'worker crashed' })
		)
		expect(result.current.isAnalyzing).toBe(false)
	})
})
