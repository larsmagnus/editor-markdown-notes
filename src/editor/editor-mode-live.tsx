import type { Editor, EditorContentProps } from '@tiptap/react'
import { EditorContext } from '@tiptap/react'

import { MenuBar } from '#src/components/menu-bar'
import { MenuBubble } from '#src/components/menu-bubble'
import { EditorSurface } from '#src/editor/editor-mode-live-surface'
import { ButtonAdd } from '#src/editor/extensions/frontmatter/button-add'
import { useMarkdownEditor } from '#src/hooks/use-markdown-editor'
import type { TextToolsState } from '#src/hooks/use-report-live-editor'
import { useReportLiveEditor } from '#src/hooks/use-report-live-editor'

interface EditorProps extends Omit<EditorContentProps, 'editor'> {
	content: string
	/** Where autosync writes. Only the VS Code path has one. */
	syncContent?: (content: string) => void
	/** Off while raw mode is on screen instead - see `EditorBody`. Stays
	 *  mounted regardless, so its undo history survives the toggle. */
	active?: boolean
	showMenu?: boolean
	includeTypesetClassNames?: boolean
	/**
	 * Reports the latest text-tools analysis to `EditorBody`, which renders the
	 * one shared `TextToolsAside` beside whichever mode is on screen. Analysis
	 * itself has to stay computed in here - it depends on the TipTap editor,
	 * which lives inside this component's error boundary so a bad document
	 * can't take raw mode's escape hatch down with it. See `useReportLiveEditor`.
	 */
	onAnalysisChange?: (state: TextToolsState) => void
	/**
	 * Reports the editor instance itself, so `EditorBody` can give the
	 * sidebar - rendered as this component's sibling, outside its own
	 * `EditorContext.Provider` below - a provider of its own to select text
	 * from an issue click (`TextToolsIssueGroup`'s `useCurrentEditor()`).
	 */
	onEditorChange?: (editor: Editor | null) => void
}

function EditorModeLive({
	content,
	syncContent,
	active = true,
	showMenu,
	includeTypesetClassNames,
	onAnalysisChange,
	onEditorChange,
	...props
}: EditorProps) {
	const { editor, analysis, isAnalyzing, hasSpellingFailed, codeBlockStyle } =
		useMarkdownEditor(content, syncContent, active)

	useReportLiveEditor({
		editor,
		analysis,
		isAnalyzing,
		hasSpellingFailed,
		onAnalysisChange,
		onEditorChange,
	})

	if (!editor) return null

	return (
		<EditorContext.Provider value={{ editor }}>
			{showMenu ? <MenuBar /> : null}
			<ButtonAdd editor={editor} />
			<EditorSurface
				includeTypesetClassNames={includeTypesetClassNames}
				codeBlockStyle={codeBlockStyle}
				{...props}
			/>
			<div>
				<MenuBubble />
			</div>
		</EditorContext.Provider>
	)
}

export default EditorModeLive
