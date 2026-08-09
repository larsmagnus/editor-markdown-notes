import { describe, expect, it } from 'vitest'

import { editModeFromViewOptions } from '@/components/edit-mode-options'
import { DEFAULT_VIEW_OPTIONS } from '@/shared/messages'

describe('editModeFromViewOptions', () => {
	it('reports raw when viewOptions.raw is true', () => {
		expect(
			editModeFromViewOptions({ ...DEFAULT_VIEW_OPTIONS, raw: true })
		).toBe('raw')
	})

	it('reports live when viewOptions.raw is false', () => {
		expect(
			editModeFromViewOptions({ ...DEFAULT_VIEW_OPTIONS, raw: false })
		).toBe('live')
	})
})
