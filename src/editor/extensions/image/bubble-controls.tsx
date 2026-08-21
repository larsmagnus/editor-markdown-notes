'use client'

import { useCurrentEditor } from '@tiptap/react'
import { Trash2 } from 'lucide-react'
import { useRef } from 'react'
import type { KeyboardEvent } from 'react'

import { ButtonUnlink } from '@/components/button-unlink'
import { LinkPopover } from '@/components/link-popover'
import { Button } from '@/components/ui/button'
import {
	exitImageToolbar,
	IMAGE_TOOLBAR_ID,
} from '@/editor/extensions/image/keyboard-nav'
import { ImagePopover } from '@/editor/extensions/image/popover'
import { useEditorImage } from '@/hooks/use-editor-image'

/** The bubble menu's controls for a selected image: edit, delete, and link wrap/unwrap. */
export function ImageBubbleControls() {
	const { editor } = useCurrentEditor()
	const { deleteImage } = useEditorImage()
	const toolbarRef = useRef<HTMLDivElement>(null)

	// Roving focus for the arrows, `exitImageToolbar` for `Tab` - the portal
	// this toolbar renders into isn't necessarily near anything else
	// focusable in DOM order, so both keys are handled here rather than left
	// to native behavior. Guarded to the toolbar's own buttons: `ImagePopover`
	// and `LinkPopover` open a form in a React portal, which is still a React
	// *tree* descendant of this handler (so the keydown still bubbles here)
	// but not a DOM descendant of `toolbarRef` - without this check, Tab
	// inside that form would jump to the next image instead of the next field.
	const handleToolbarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (!toolbarRef.current?.contains(document.activeElement)) return

		if (event.key === 'Tab') {
			event.preventDefault()
			if (editor) exitImageToolbar(editor, event.shiftKey)
			return
		}

		if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return

		const buttons = Array.from(
			toolbarRef.current?.querySelectorAll('button') ?? []
		)
		const active = document.activeElement
		const currentIndex =
			active instanceof HTMLButtonElement ? buttons.indexOf(active) : -1
		if (currentIndex === -1) return

		event.preventDefault()
		const step = event.key === 'ArrowRight' ? 1 : -1
		const nextIndex = (currentIndex + step + buttons.length) % buttons.length
		buttons[nextIndex]?.focus()
	}

	return (
		<div
			id={IMAGE_TOOLBAR_ID}
			ref={toolbarRef}
			role="toolbar"
			aria-label="Image controls"
			onKeyDown={handleToolbarKeyDown}
			className="flex items-center gap-1 p-1 bg-popover text-popover-foreground border border-border rounded-lg shadow-xs drop-shadow-lg w-fit"
		>
			<ImagePopover />

			<LinkPopover />

			<ButtonUnlink />

			<Button
				type="button"
				variant="ghost"
				size="sm"
				title="Delete image"
				onClick={deleteImage}
			>
				<Trash2 className="size-4" />
			</Button>
		</div>
	)
}
