import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createAnalyzer } from '@/lib/text-tools/analyze-client'
import type { AnalyzeRequest, PipelineOptions } from '@/lib/text-tools/types'

/**
 * The real worker is an inlined blob happy-dom cannot start, and the analysis
 * itself is covered against the real retext stack elsewhere. What matters here
 * is the request the client shapes - specifically when it does and does not
 * spend a ~575kB structured clone on the dictionary.
 */
const posted = vi.hoisted(() => [] as AnalyzeRequest[])

vi.mock('@/lib/text-tools/analyze.worker.ts?worker&inline', () => ({
	default: class {
		addEventListener() {}
		terminate() {}
		postMessage(request: AnalyzeRequest) {
			posted.push(request)
		}
	},
}))

const AMERICAN = { aff: 'SET UTF-8', dic: '1\nreport' }
const BRITISH = { aff: 'SET UTF-8', dic: '1\ncolour' }

const BASE: Omit<PipelineOptions, 'rules' | 'dictionary' | 'spellingLanguage'> =
	{
		targetAge: 16,
		ignoreWords: [],
	}

beforeEach(() => {
	posted.length = 0
})

describe('createAnalyzer', () => {
	it('sends a language the worker has not been given, then stops sending it', () => {
		const analyzer = createAnalyzer()
		const options: PipelineOptions = {
			rules: ['spelling'],
			spellingLanguage: 'en-US',
			dictionary: AMERICAN,
			...BASE,
		}

		void analyzer.analyze('One.', options)
		void analyzer.analyze('Two.', options)

		expect(posted[0].dictionary).toEqual(AMERICAN)
		expect(posted[1].dictionary).toBeUndefined()
	})

	it('does not count a dictionary the worker will throw away', () => {
		const analyzer = createAnalyzer()

		// The hook keeps a loaded dictionary while the rule is unticked, so the
		// bytes are here even though the worker will skip the spelling pass and
		// never cache them.
		void analyzer.analyze('One.', {
			rules: ['passive'],
			spellingLanguage: 'en-US',
			dictionary: AMERICAN,
			...BASE,
		})
		void analyzer.analyze('Two.', {
			rules: ['spelling'],
			spellingLanguage: 'en-US',
			dictionary: AMERICAN,
			...BASE,
		})

		expect(posted[0].dictionary).toBeUndefined()
		// Ticking the rule has to still deliver them, or the worker throws
		// "No en-US dictionary has been supplied" on every run after this.
		expect(posted[1].dictionary).toEqual(AMERICAN)
	})

	it('remembers every language it has sent, not just the last one', () => {
		const analyzer = createAnalyzer()

		void analyzer.analyze('One.', {
			rules: ['spelling'],
			spellingLanguage: 'en-US',
			dictionary: AMERICAN,
			...BASE,
		})
		void analyzer.analyze('Two.', {
			rules: ['spelling'],
			spellingLanguage: 'en-GB',
			dictionary: BRITISH,
			...BASE,
		})
		void analyzer.analyze('Three.', {
			rules: ['spelling'],
			spellingLanguage: 'en-US',
			dictionary: AMERICAN,
			...BASE,
		})

		expect(posted[0].dictionary).toEqual(AMERICAN)
		expect(posted[1].dictionary).toEqual(BRITISH)
		// The worker still holds en-US: its processor cache is keyed by language
		// and nothing evicts it.
		expect(posted[2].dictionary).toBeUndefined()
	})
})
