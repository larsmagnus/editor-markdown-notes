import { describe, expect, it } from 'vitest'

import {
	rawGutterRoomClassName,
	rawGutterWidthStyle,
} from '#src/lib/raw-gutter-room-class'

describe('rawGutterRoomClassName', () => {
	it('makes room for the gutter on a left-aligned column', () => {
		expect(
			rawGutterRoomClassName({
				lineNumbers: true,
				centerContent: false,
				fullWidth: false,
			})
		).toBe('ml-(--raw-gutter-width)')
	})

	it('leaves a centered column alone', () => {
		expect(
			rawGutterRoomClassName({
				lineNumbers: true,
				centerContent: true,
				fullWidth: false,
			})
		).toBe('')
	})

	it('makes room when centering has no effect because the column is full width', () => {
		expect(
			rawGutterRoomClassName({
				lineNumbers: true,
				centerContent: true,
				fullWidth: true,
			})
		).toBe('ml-(--raw-gutter-width)')
	})

	it('makes no room when line numbers are off', () => {
		expect(
			rawGutterRoomClassName({
				lineNumbers: false,
				centerContent: false,
				fullWidth: false,
			})
		).toBe('')
	})
})

describe('rawGutterWidthStyle', () => {
	function width(lineCount: number) {
		return (rawGutterWidthStyle(lineCount) as Record<string, string>)[
			'--raw-gutter-width'
		]
	}

	it('holds three digits for a short note', () => {
		expect(width(8)).toBe('calc(3ch + 0.75rem)')
	})

	it('stays at three digits up to 999 lines', () => {
		expect(width(999)).toBe('calc(3ch + 0.75rem)')
	})

	it('grows a digit at 1,000 lines', () => {
		expect(width(1000)).toBe('calc(4ch + 0.75rem)')
	})

	it('grows again at 10,000 lines', () => {
		expect(width(10000)).toBe('calc(5ch + 0.75rem)')
	})
})
