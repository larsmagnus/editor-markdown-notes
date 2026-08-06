import { Color } from '@tiptap/extension-color'
import Link from '@tiptap/extension-link'
import ListItem from '@tiptap/extension-list-item'
import TextStyle from '@tiptap/extension-text-style'
import type { TextStyleOptions } from '@tiptap/extension-text-style'
import type { EditorContentProps, EditorEvents } from '@tiptap/react'
import {
	EditorConsumer,
	EditorContent,
	EditorContext,
	useEditor,
} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import { Markdown } from 'tiptap-markdown'
import { useDebounceValue } from 'usehooks-ts'

import { MenuBar } from '@/editor/menu-bar'
import { MenuBubble } from '@/editor/menu-bubble'
import { useVSCode } from '@/hooks/use-vscode'
import { updateNotes } from '@/lib/update-notes'
import { cn } from '@/lib/utils'

interface EditorProps extends Omit<EditorContentProps, 'editor'> {
	content: string
	showMenu?: boolean
	includeProseBaseClassNames?: boolean
}

const extensions = [
	Color.configure({ types: [TextStyle.name, ListItem.name] }),
	TextStyle.configure({ types: [ListItem.name] } as Partial<TextStyleOptions>),
	Link.configure({}),
	StarterKit.configure({
		bulletList: {
			keepMarks: true,
			keepAttributes: false,
		},
		orderedList: {
			keepMarks: true,
			keepAttributes: false,
		},
	}),
	Markdown.configure({
		// No p inside li in md
		tightLists: true,
	}),
]

function Editor({
	content,
	showMenu,
	includeProseBaseClassNames,
	...props
}: EditorProps) {
	const { className, ...restEditorContainer } = props || {}
	const { isVSCodeContext, saveContent } = useVSCode()

	const [debouncedValue, setValue] = useDebounceValue('', 1000)

	const handleUpdate = (props: EditorEvents['update']) => {
		const markdown = props.editor?.storage?.markdown?.getMarkdown()
		setValue(markdown)
	}

	const editor = useEditor({
		extensions,
		content,
		onUpdate: handleUpdate,
		autofocus: 'end',
		// ...other options...
	})

	// Handle manual save requests (e.g., from Cmd+S)
	useEffect(() => {
		if (!isVSCodeContext || !editor) return

		const handleManualSave = () => {
			const currentMarkdown = editor.storage?.markdown?.getMarkdown()
			if (currentMarkdown) {
				saveContent(currentMarkdown)
			}
		}

		window.addEventListener('vscode-save-request', handleManualSave)
		return () => {
			window.removeEventListener('vscode-save-request', handleManualSave)
		}
	}, [editor, isVSCodeContext, saveContent])

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
		if (editor && content !== undefined && editor.getHTML() !== content) {
			editor.commands.setContent(content)
		}
	}, [content, editor])

	if (!editor) return null

	return (
		<>
			<EditorContext.Provider value={{ editor }}>
				{showMenu ? <MenuBar /> : null}
				<EditorConsumer>
					{({ editor: currentEditor }) => (
						<EditorContent
							editor={currentEditor}
							spellCheck={false}
							className={cn(
								includeProseBaseClassNames &&
									'prose dark:prose-invert prose-headings:font-bold prose-headings:text-black dark:prose-headings:text-white prose-td:font-mono',
								'prose-headings:first:mt-0 prose-p:first:mt-0',
								className
							)}
							{...restEditorContainer}
						/>
					)}
				</EditorConsumer>
				<div>
					<MenuBubble />
				</div>
			</EditorContext.Provider>
		</>
	)
}

export default Editor
