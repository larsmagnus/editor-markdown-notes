import type { EditorContentProps } from '@tiptap/react'
import { EditorContext } from '@tiptap/react'

import { MenuBar } from '#src/components/menu-bar'
import { MenuBubble } from '#src/components/menu-bubble'
import { EditorSurface } from '#src/editor/editor-mode-live-surface'
import { ButtonAdd } from '#src/editor/extensions/frontmatter/button-add'
import { useMarkdownEditor } from '#src/hooks/use-markdown-editor'
import { TextToolsAside } from '#src/text-tools/text-tools-aside'

interface EditorProps extends Omit<EditorContentProps, 'editor'> {
	content: string
	/** Where autosync writes. Only the VS Code path has one. */
	syncContent?: (content: string) => void
	/** Off while raw mode is on screen instead - see `EditorBody`. Stays
	 *  mounted regardless, so its undo history survives the toggle. */
	active?: boolean
	showMenu?: boolean
	includeTypesetClassNames?: boolean
}

function EditorModeLive({
	content,
	syncContent,
	active = true,
	showMenu,
	includeTypesetClassNames,
	...props
}: EditorProps) {
	const { editor, analysis, isAnalyzing, hasSpellingFailed, codeBlockStyle } =
		useMarkdownEditor(content, syncContent, active)

	if (!editor) return null

	return (
		<EditorContext.Provider value={{ editor }}>
			{showMenu ? <MenuBar /> : null}
			<ButtonAdd editor={editor} />
			<EditorSurface
				includeTypesetClassNames={includeTypesetClassNames}
				codeBlockStyle={codeBlockStyle}
				panel={
					<TextToolsAside
						analysis={analysis}
						isAnalyzing={isAnalyzing}
						hasSpellingFailed={hasSpellingFailed}
					/>
				}
				{...props}
			/>
			<div>
				<MenuBubble />
			</div>
		</EditorContext.Provider>
	)
}

export default EditorModeLive
