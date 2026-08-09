import { useCurrentEditor } from '@tiptap/react'

import { Button } from '@/components/ui/button'
import { ButtonStyle } from '@/editor/button-style'
import { HeadingButtons } from '@/editor/heading-buttons'
import { MENU_BAR_COMMANDS } from '@/editor/menu-bar-commands'
import { useEditorHistory } from '@/hooks/use-editor-history'

export function MenuBar() {
	const { editor } = useCurrentEditor()
	const { undo, redo, canUndo, canRedo } = useEditorHistory()

	if (!editor) {
		return null
	}

	return (
		<div className="flex gap-1">
			<ButtonStyle style="bold" className="font-bold" />
			<ButtonStyle style="italic" className="italic" />
			<ButtonStyle style="strike" className="line-through" />
			<ButtonStyle style="code" />
			<ButtonStyle style="paragraph" />

			{MENU_BAR_COMMANDS.map(({ label, apply }) => (
				<Button
					key={label}
					type="button"
					onClick={() => apply(editor.chain().focus()).run()}
				>
					{label}
				</Button>
			))}

			<HeadingButtons />

			<ButtonStyle style="unordered">Bullet list</ButtonStyle>
			<ButtonStyle style="ordered">Ordered list</ButtonStyle>
			<ButtonStyle style="codeBlock">Code block</ButtonStyle>
			<ButtonStyle style="blockquote">Blockquote</ButtonStyle>

			<Button type="button" onClick={undo} disabled={!canUndo()}>
				Undo
			</Button>
			<Button type="button" onClick={redo} disabled={!canRedo()}>
				Redo
			</Button>
		</div>
	)
}
