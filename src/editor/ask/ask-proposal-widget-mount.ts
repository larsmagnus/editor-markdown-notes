import type { Editor } from '@tiptap/core'
import { createElement } from 'react'

import { AppErrorBoundary } from '@/components/app-error-boundary'
import { AskProposalWidget } from '@/editor/ask/ask-proposal-widget'
import type { AskProposalState } from '@/editor/ask/ask-suggestion-extension'
import { createWidgetMount } from '@/editor/decoration-widget-mount'

const widget = createWidgetMount()

export const unmountActiveWidget = widget.unmount

/**
 * Renders the proposal into the one React root this module ever has open -
 * called on every relevant state read, not just when ProseMirror decides to
 * build a fresh widget for a new key, which is what makes a streamed chunk
 * show up without needing the decoration itself to be rebuilt.
 *
 * Wrapped in its own `AppErrorBoundary`: this root sits outside the app's
 * normal component tree (TipTap mounts each decoration widget separately,
 * the same reason `code-block-view.tsx`'s mermaid boundary lives where it
 * does), so nothing else would catch a render failure here. "Remove" declines
 * the proposal outright, since a stuck one can't be fixed by retrying alone.
 */
export function renderWidget(
	proposal: AskProposalState,
	editor: Editor
): HTMLElement {
	return widget.render(
		proposal.id,
		createElement(
			AppErrorBoundary,
			{
				title: 'Ask Claude',
				resetKeys: [proposal.id],
				onRemove: () => editor.commands.declineAskProposal({ id: proposal.id }),
			},
			createElement(AskProposalWidget, {
				proposal,
				onAccept: () => editor.commands.acceptAskProposal({ id: proposal.id }),
				onDecline: () =>
					editor.commands.declineAskProposal({ id: proposal.id }),
				onRetry: () =>
					editor.commands.startAskProposal({
						from: proposal.from,
						to: proposal.to,
						prompt: proposal.prompt,
					}),
				onClose: () => editor.commands.closeAskProposal({ id: proposal.id }),
				onEditText: (text: string) =>
					editor.commands.editAskProposalText({ id: proposal.id, text }),
			})
		)
	)
}
