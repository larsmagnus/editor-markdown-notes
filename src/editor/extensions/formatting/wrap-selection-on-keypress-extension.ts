import { Extension } from '@tiptap/core'
import type { CommandProps } from '@tiptap/core'
import type { MarkType } from '@tiptap/pm/model'
import { Plugin } from '@tiptap/pm/state'

import { createToggleItalicCommand } from '#src/editor/extensions/italic/create-toggle-italic-command'

export const WrapSelectionOnKeypress = Extension.create({
	name: 'wrapSelectionOnKeypress',

	addProseMirrorPlugins() {
		const { editor } = this

		return [
			new Plugin({
				props: {
					handleTextInput: (view, _from, _to, text) => {
						if (text.length !== 1) return false
						if (view.state.selection.empty) return false

						const char = text
						const { state } = view
						const italicMarkType = state.schema.marks.italic as
							| MarkType
							| undefined

						switch (char) {
							case '`':
								editor.commands.toggleCode()
								return true
							case '~':
								editor.commands.toggleStrike()
								return true
							case '*':
							case '_':
								if (!italicMarkType) return false
								const command = createToggleItalicCommand(
									italicMarkType,
									'italic',
									() => char
								)
								const commandProps: CommandProps = {
									state,
									dispatch: view.dispatch,
									editor,
									chain: () => editor.chain(),
									can: () => editor.can(),
									commands: editor.commands,
									tr: state.tr,
									view,
								}
								command(commandProps)
								return true
							case '"':
							case "'":
								const { from, to } = state.selection
								const tr = state.tr
								tr.insertText(char, to)
								tr.insertText(char, from)
								view.dispatch(tr)
								return true
							default:
								return false
						}
					},
				},
			}),
		]
	},
})
