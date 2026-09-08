import { render, screen } from '@testing-library/react'
import { EditorContext } from '@tiptap/react'
import { describe, expect, it } from 'vitest'

import { TextBubbleControls } from '@/components/text-bubble-controls'
import { SettingsContext } from '@/hooks/use-settings'
import { DEFAULT_SETTINGS, DEFAULT_VIEW_OPTIONS } from '@/shared/messages'
import { createEditor } from '@/test-utils/editor'

function renderControls(isVSCodeContext: boolean) {
	const editor = createEditor('<p>Hello world</p>', { parseOnly: true })

	render(
		<SettingsContext.Provider
			value={{
				viewOptions: DEFAULT_VIEW_OPTIONS,
				setViewOptions: () => {},
				settings: DEFAULT_SETTINGS,
				isVSCodeContext,
			}}
		>
			<EditorContext.Provider value={{ editor }}>
				<TextBubbleControls />
			</EditorContext.Provider>
		</SettingsContext.Provider>
	)
}

describe('TextBubbleControls', () => {
	it('hides the ask Claude button outside the VS Code webview', () => {
		renderControls(false)

		expect(
			screen.queryByRole('button', { name: 'Ask Claude' })
		).not.toBeInTheDocument()
	})

	it('shows the ask Claude button inside the VS Code webview', () => {
		renderControls(true)

		expect(
			screen.getByRole('button', { name: 'Ask Claude' })
		).toBeInTheDocument()
	})
})
