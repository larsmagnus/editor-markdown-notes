import type { EditorContentProps, EditorEvents } from '@tiptap/react'
import {
	EditorConsumer,
	EditorContent,
	EditorContext,
	useEditor,
} from '@tiptap/react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { useDebounceValue } from 'usehooks-ts'

import { extensions } from '@/editor/extensions'
import { FrontmatterPanel } from '@/editor/frontmatter-panel'
import { MenuBar } from '@/editor/menu-bar'
import { MenuBubble } from '@/editor/menu-bubble'
import { useSettings } from '@/hooks/use-settings'
import { useTextTools } from '@/hooks/use-text-tools'
import { useVSCode } from '@/hooks/use-vscode'
import { joinFrontmatter, splitFrontmatter } from '@/lib/frontmatter'
import { updateNotes } from '@/lib/update-notes'
import { cn } from '@/lib/utils'

const TextToolsPanel = lazy(() =>
	import('@/editor/text-tools-panel').then((module) => ({
		default: module.TextToolsPanel,
	}))
)

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
	const { className, ...restEditorContainer } = props || {}
	const { isVSCodeContext, saveContent } = useVSCode()
	const { viewOptions, setViewOptions, settings } = useSettings()

	const [debouncedValue, setValue] = useDebounceValue('', 1000)

	// Frontmatter never enters the TipTap document (markdown-it has no concept
	// of it, so it would parse as an `<hr>` plus headings). It's held here as
	// raw text and stitched back onto the body markdown before saving.
	const [frontmatter, setFrontmatter] = useState(
		() => splitFrontmatter(content).frontmatter
	)

	const handleUpdate = (props: EditorEvents['update']) => {
		const markdown = props.editor?.storage?.markdown?.getMarkdown()
		setValue(joinFrontmatter(frontmatter, markdown))
	}

	const handleFrontmatterChange = (nextFrontmatter: string) => {
		setFrontmatter(nextFrontmatter)

		const markdown = editor?.storage?.markdown?.getMarkdown() ?? ''
		setValue(joinFrontmatter(nextFrontmatter, markdown))
	}

	const editor = useEditor({
		extensions,
		content: splitFrontmatter(content).body,
		onUpdate: handleUpdate,
		autofocus: 'end',
		// ...other options...
	})

	const { analysis, isAnalyzing } = useTextTools({
		editor,
		enabled: viewOptions.textTools,
		rules: viewOptions.textToolRules,
		targetAge: settings.textToolsTargetAge,
	})

	// The italic mark reads this at the moment a new italic is created (see
	// `Italic.extend` in extensions.ts) - `extensions` is built once, so the
	// only way for `editorMarkdownNotes.italicMarker` to reach it live is
	// through mutable storage rather than an extension option.
	useEffect(() => {
		if (!editor) return
		editor.storage.italic.preferredMarkup = settings.italicMarker
	}, [editor, settings.italicMarker])

	// Handle manual save requests (e.g., from Cmd+S)
	useEffect(() => {
		if (!isVSCodeContext || !editor) return

		const handleManualSave = () => {
			const currentMarkdown = editor.storage?.markdown?.getMarkdown()
			if (currentMarkdown) {
				saveContent(joinFrontmatter(frontmatter, currentMarkdown))
			}
		}

		window.addEventListener('vscode-save-request', handleManualSave)
		return () => {
			window.removeEventListener('vscode-save-request', handleManualSave)
		}
	}, [editor, isVSCodeContext, saveContent, frontmatter])

	/**
	 * Save the markdown - use VSCode API if in extension context, otherwise local file system
	 */
	useEffect(() => {
		if (!debouncedValue) return

		async function saveMarkdown() {
			try {
				if (isVSCodeContext) {
					// Save through VSCode API
					saveContent(debouncedValue)
				} else {
					// Save to local file system (standalone mode)
					await updateNotes(debouncedValue)
				}
			} catch (error) {
				console.error('Error saving markdown:', error)
			} finally {
				console.log('Saved markdown', debouncedValue)
			}
		}

		saveMarkdown()
	}, [debouncedValue, isVSCodeContext, saveContent])

	// Update content when prop changes
	useEffect(() => {
		if (!editor || content === undefined) return

		const { frontmatter: nextFrontmatter, body } = splitFrontmatter(content)
		if (editor.getHTML() !== body) {
			editor.commands.setContent(body)
		}

		setFrontmatter((prev) =>
			nextFrontmatter !== prev ? nextFrontmatter : prev
		)
	}, [content, editor])

	if (!editor) return null

	return (
		<>
			<EditorContext.Provider value={{ editor }}>
				{showMenu ? <MenuBar /> : null}
				<FrontmatterPanel
					value={frontmatter}
					onChange={handleFrontmatterChange}
				/>
				{/* The panel reads the editor off `EditorContext`, so it has to live
				    in here rather than alongside the editor in `content.tsx`. */}
				<div className="flex items-start gap-4">
					<EditorConsumer>
						{({ editor: currentEditor }) => (
							<EditorContent
								editor={currentEditor}
								spellCheck={false}
								className={cn(
									includeProseBaseClassNames &&
										'prose dark:prose-invert prose-headings:font-bold prose-headings:text-black dark:prose-headings:text-white',
									'prose-headings:first:mt-0 prose-p:first:mt-0',
									'min-w-0 flex-1',
									className
								)}
								{...restEditorContainer}
							/>
						)}
					</EditorConsumer>

					{viewOptions.textTools && (
						<Suspense fallback={null}>
							<TextToolsPanel
								analysis={analysis}
								isAnalyzing={isAnalyzing}
								rules={viewOptions.textToolRules}
								setRules={(textToolRules) => setViewOptions({ textToolRules })}
							/>
						</Suspense>
					)}
				</div>
				<div>
					<MenuBubble />
				</div>
			</EditorContext.Provider>
		</>
	)
}

export default Editor
