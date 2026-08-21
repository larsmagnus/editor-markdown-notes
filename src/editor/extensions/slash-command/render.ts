import type { Editor } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import type {
	SuggestionKeyDownProps,
	SuggestionProps,
} from '@tiptap/suggestion'

import type { SlashCommandItem } from '@/editor/extensions/slash-command/commands'
import { SlashCommandMenu } from '@/editor/extensions/slash-command/menu'
import type { SlashCommandMenuHandle } from '@/editor/extensions/slash-command/menu'

/** What the rendered menu needs, kept separate from `SlashCommandItem` so `run` never leaks into props. */
interface SlashCommandMenuProps {
	items: SlashCommandItem[]
	onSelect: (item: SlashCommandItem) => void
}

function propsFor(
	suggestionProps: SuggestionProps<SlashCommandItem>
): SlashCommandMenuProps {
	return { items: suggestionProps.items, onSelect: suggestionProps.command }
}

/**
 * The `Suggestion` render lifecycle for the slash command menu: mounts
 * `SlashCommandMenu` via `ReactRenderer` and positions it through
 * `Suggestion`'s own floating-ui `mount()` - the installed version's
 * recommended path, needing no positioning code of its own.
 */
export function createSlashCommandRender() {
	let component: ReactRenderer<SlashCommandMenuHandle, SlashCommandMenuProps>
	let unmount: (() => void) | undefined

	const close = () => {
		unmount?.()
		component.destroy()
	}

	return {
		onStart: (suggestionProps: SuggestionProps<SlashCommandItem>) => {
			component = new ReactRenderer(SlashCommandMenu, {
				editor: suggestionProps.editor as Editor,
				props: propsFor(suggestionProps),
			})
			unmount = suggestionProps.mount(component.element)
		},
		onUpdate: (suggestionProps: SuggestionProps<SlashCommandItem>) => {
			component.updateProps(propsFor(suggestionProps))
		},
		onKeyDown: (keyDownProps: SuggestionKeyDownProps) => {
			if (keyDownProps.event.key === 'Escape') {
				close()
				return true
			}

			return component.ref?.onKeyDown(keyDownProps.event) ?? false
		},
		onExit: close,
	}
}
