import type { EditorContentProps } from '@tiptap/react'
import { EditorContext } from '@tiptap/react'

import { MenuBar } from '@/components/menu-bar'
import { MenuBubble } from '@/components/menu-bubble'
import { EditorSurface } from '@/editor/editor-mode-live-surface'
import { ButtonAdd } from '@/editor/extensions/frontmatter/button-add'
import { useMarkdownEditor } from '@/hooks/use-markdown-editor'
import { TextToolsAside } from '@/text-tools/text-tools-aside'

interface EditorProps extends Omit<EditorContentProps, 'editor'> {
	content: string
	/** Where autosave writes. Only the VS Code path has one. */
	saveContent?: (content: string) => void
	showMenu?: boolean
	includeProseBaseClassNames?: boolean
}

function EditorModeLive({
	content,
	saveContent,
	showMenu,
	includeProseBaseClassNames,
	...props
}: EditorProps) {
	const { editor, analysis, isAnalyzing, hasSpellingFailed, codeBlockStyle } =
		useMarkdownEditor(content, saveContent)

	if (!editor) return null

	return (
		<EditorContext.Provider value={{ editor }}>
			{showMenu ? <MenuBar /> : null}
			<ButtonAdd editor={editor} />
			<EditorSurface
				includeProseBaseClassNames={includeProseBaseClassNames}
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
