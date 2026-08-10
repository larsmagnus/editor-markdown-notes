import type { EditorContentProps } from '@tiptap/react'
import { EditorContext } from '@tiptap/react'

import { EditorSurface } from '@/editor/editor-surface'
import { FrontmatterPanel } from '@/editor/frontmatter-panel'
import { MenuBar } from '@/editor/menu-bar'
import { MenuBubble } from '@/editor/menu-bubble'
import { TextToolsAside } from '@/editor/text-tools-aside'
import { useMarkdownEditor } from '@/hooks/use-markdown-editor'

interface EditorProps extends Omit<EditorContentProps, 'editor'> {
	content: string
	showMenu?: boolean
	includeProseBaseClassNames?: boolean
}

function Editor({
	content,
	showMenu,
	includeProseBaseClassNames,
	...props
}: EditorProps) {
	const {
		editor,
		frontmatter,
		handleFrontmatterChange,
		analysis,
		isAnalyzing,
		codeBlockStyle,
	} = useMarkdownEditor(content)

	if (!editor) return null

	return (
		<EditorContext.Provider value={{ editor }}>
			{showMenu ? <MenuBar /> : null}
			<FrontmatterPanel
				value={frontmatter}
				onChange={handleFrontmatterChange}
			/>
			{/* The panel reads the editor off `EditorContext`, so it has to live in
			    here rather than alongside the editor in `content.tsx`. */}
			<EditorSurface
				includeProseBaseClassNames={includeProseBaseClassNames}
				codeBlockStyle={codeBlockStyle}
				panel={<TextToolsAside analysis={analysis} isAnalyzing={isAnalyzing} />}
				{...props}
			/>
			<div>
				<MenuBubble />
			</div>
		</EditorContext.Provider>
	)
}

export default Editor
