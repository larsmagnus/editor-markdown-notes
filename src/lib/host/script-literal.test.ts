import { describe, expect, it } from 'vitest'

import { toScriptLiteral } from '@/lib/host/script-literal'

describe('toScriptLiteral', () => {
	it('escapes every `<` so a closing tag cannot end the block early', () => {
		expect(toScriptLiteral('</script>')).toBe('"\\u003c/script>"')
	})

	it('escapes an opening tag too', () => {
		expect(toScriptLiteral('<div>')).toBe('"\\u003cdiv>"')
	})

	it('escapes every occurrence, not just the first', () => {
		expect(toScriptLiteral('<a><b>')).toBe('"\\u003ca>\\u003cb>"')
	})

	it('round-trips back through JSON.parse', () => {
		const note = '# Roadmap\n\nUse </script> carefully. "Quoted", too.'

		expect(JSON.parse(toScriptLiteral(note))).toBe(note)
	})

	it('round-trips a nested object', () => {
		const config = {
			settings: { italicMarker: '_' },
			viewOptions: { raw: false },
		}

		expect(JSON.parse(toScriptLiteral(config))).toEqual(config)
	})
})
