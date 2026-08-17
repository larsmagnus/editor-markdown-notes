import type { Meta, StoryObj } from '@storybook/react-vite'
import { useCurrentEditor } from '@tiptap/react'
import { useEffect } from 'react'

import { EditorContextMount } from '@/editor/editor-context-decorator'

/**
 * Starts the `/ask` loading widget once the editor mounts, so the story shows
 * the state directly rather than requiring a click through Storybook -
 * `ask-command.ts` does the same thing for real, right after deleting the
 * typed `/ask` text.
 */
function SeedAskLoading() {
	const { editor } = useCurrentEditor()

	useEffect(() => {
		if (!editor) return
		editor.commands.startAskLoading({ pos: 1, onCancel: () => {} })
	}, [editor])

	return null
}

/** Same idea as `SeedAskLoading`, for the failed-request state. */
function SeedAskError() {
	const { editor } = useCurrentEditor()

	useEffect(() => {
		if (!editor) return
		editor.commands.showAskInlineError({
			pos: 1,
			error: 'Claude CLI not found on PATH',
			onRetry: () => {},
		})
	}, [editor])

	return null
}

/**
 * The `/ask` slash command's interstitial states, none of which are their own
 * standalone component - both the loading spinner and the error card render
 * inline via a decoration (`ask-inline-loading-widget.stories.tsx` and
 * `ask-inline-error-widget.stories.tsx` show each in isolation; this shows
 * them composited into real content, which is where their layout actually
 * matters - the spinner sits mid-paragraph at the cursor, not on its own line).
 *
 * The streamed reply lands as ordinary document text (`ask-command.ts`'s
 * `streamAskInto`), with no separate "result" step: unlike the bubble menu's
 * proposal (`ask-proposal-widget.stories.tsx`'s `Done` story), `/ask` never
 * pauses for accept/decline/redo - that flow belongs to the bubble menu's
 * sparkles popover only, not this command.
 */
const meta = {
	title: 'editor/slash-command/Ask Claude inline states',
	parameters: {
		layout: 'centered',
	},
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Waiting on the first streamed chunk back - a spinner at the cursor, not static "..." text. */
export const Loading: Story = {
	render: () => (
		<EditorContextMount content="<p>Some note content above the cursor.</p>">
			<SeedAskLoading />
		</EditorContextMount>
	),
}

/** The reply, written straight into the document as it streams - no accept/decline step. */
export const StreamedResult: Story = {
	render: () => (
		<EditorContextMount content="<p>Here is a concise summary of the note.</p>" />
	),
}

/**
 * A failed request shows the same `ErrorFallback` card every other error
 * boundary in the app uses - "Try again" re-runs the same prompt, the X
 * dismisses and leaves nothing behind. No partial reply is ever left in the
 * document once this shows.
 */
export const Error: Story = {
	render: () => (
		<EditorContextMount content="<p>Some note content above the cursor.</p>">
			<SeedAskError />
		</EditorContextMount>
	),
}
