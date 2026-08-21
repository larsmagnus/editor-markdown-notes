import { render, screen } from '@testing-library/react'
import { Editor, EditorContext } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'

import { TextBubbleControls } from '@/components/text-bubble-controls'
import { extensions } from '@/editor/extensions/extensions'
import { SettingsContext } from '@/hooks/use-settings'
import { DEFAULT_SETTINGS, DEFAULT_VIEW_OPTIONS } from '@/shared/messages'

let currentEditor: Editor | undefined

afterEach(() => {
	currentEditor?.destroy()
	currentEditor = undefined
})

function renderControls(isVSCodeContext: boolean) {
	const editor = new Editor({ extensions, content: '<p>Hello world</p>' })
	currentEditor = editor

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
