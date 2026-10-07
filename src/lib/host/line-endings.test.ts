import { describe, expect, it } from 'vitest'

import { toLf } from '#src/lib/host/line-endings'

describe('toLf', () => {
	it('turns CRLF line endings into LF', () => {
		expect(toLf('# Roadmap\r\n\r\nShip it.\r\n')).toBe(
			'# Roadmap\n\nShip it.\n'
		)
	})

	it('turns a lone CR into LF, as VS Code counts it as a line break', () => {
		expect(toLf('Ship it.\rDone.')).toBe('Ship it.\nDone.')
	})

	it('leaves LF text untouched', () => {
		expect(toLf('# Roadmap\n\nShip it.\n')).toBe('# Roadmap\n\nShip it.\n')
	})
})
