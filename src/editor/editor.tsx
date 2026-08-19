import type { EditorContentProps } from '@tiptap/react'
import { EditorContext } from '@tiptap/react'

import { EditorSurface } from '@/editor/editor-surface'
import { FrontmatterAddButton } from '@/editor/frontmatter/add-button'
import { MenuBar } from '@/editor/menu-bar'
import { MenuBubble } from '@/editor/menu-bubble'
import { TextToolsAside } from '@/editor/text-tools-aside'
import { useMarkdownEditor } from '@/hooks/use-markdown-editor'

interface EditorProps extends Omit<EditorContentProps, 'editor'> {
	content: string
	/** Where autosave writes. Only the VS Code path has one. */
	saveContent?: (content: string) => void
	showMenu?: boolean
	includeProseBaseClassNames?: boolean
}

function Editor({
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
			<FrontmatterAddButton editor={editor} />
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

export default Editor
