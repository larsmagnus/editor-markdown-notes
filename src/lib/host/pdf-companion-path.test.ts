import { describe, expect, it } from 'vitest'

import { companionPathFor } from '#src/lib/host/pdf-companion-path'

describe('companionPathFor', () => {
	it('appends .md to a plain PDF path', () => {
		expect(companionPathFor('/notes/report.pdf')).toBe('/notes/report.pdf.md')
	})

	it('appends .md to a PDF path in a nested directory', () => {
		expect(companionPathFor('/notes/archive/2024/report.pdf')).toBe(
			'/notes/archive/2024/report.pdf.md'
		)
	})

	it('appends .md to a PDF path with spaces in the name', () => {
		expect(companionPathFor('/notes/Q3 Report.pdf')).toBe(
			'/notes/Q3 Report.pdf.md'
		)
	})

	it('appends .md to a filename that already contains dots', () => {
		expect(companionPathFor('/notes/report.v2.pdf')).toBe(
			'/notes/report.v2.pdf.md'
		)
	})

	it('matches the extension case-insensitively', () => {
		expect(companionPathFor('/notes/report.PDF')).toBe('/notes/report.PDF.md')
	})
})
