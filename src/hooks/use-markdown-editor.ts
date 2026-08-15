import { useEditor } from '@tiptap/react'
import { useCallback, useRef } from 'react'

import { extensions } from '@/editor/extensions'
import { useFrontmatterDocument } from '@/hooks/use-frontmatter-document'
import { useItalicMarker } from '@/hooks/use-italic-marker'
import { useMarkdownAutosave } from '@/hooks/use-markdown-autosave'
import { useSettings } from '@/hooks/use-settings'
import { useSyntaxHighlight } from '@/hooks/use-syntax-highlight'
import { useTextTools } from '@/hooks/use-text-tools'
import { splitFrontmatter } from '@/lib/frontmatter'

/** Stable, so the default does not rebuild `save` on every render. */
const noSaveTarget = () => {}

/**
 * Everything the editor needs to run one note: the TipTap instance, autosaving,
 * the writing checks and the live italic marker.
 *
 * Composed here rather than in the component so the component is only layout,
 * and so the order these depend on each other is stated once.
 *
 * `saveContent` comes from the caller rather than from `useHostDocument` here,
 * because that hook holds state: calling it twice would give the editor a
 * second, private copy of the document, and every save would land in the one
 * nothing else reads. It is optional since only the VS Code path ever writes -
 * standalone, `useNoteSave` routes to the `updateNotes` stub instead.
 */
export function useMarkdownEditor(
	content: string,
	saveContent: (content: string) => void = noSaveTarget
) {
	const { viewOptions, settings, isVSCodeContext } = useSettings()

	// What this editor last wrote back, so the `content` that returns through
	// the host is recognizable as its own echo rather than an outside edit.
	const lastSaved = useRef<string | null>(null)

	const save = useCallback(
		(next: string) => {
			lastSaved.current = next
			saveContent(next)
		},
		[saveContent]
	)

	const isOwnSave = useCallback(
		(next: string) => lastSaved.current === next,
		[]
	)

	const editor = useEditor({
		extensions,
		// markdown-it has no concept of frontmatter and would parse `---` as an
		// `<hr>`, so the initial content is body-only - `useFrontmatterDocument`
		// inserts the frontmatter node right after mount, the same way it
		// rebuilds the doc for any later incoming change.
		content: splitFrontmatter(content).body,
		autofocus: 'end',
	})

	useFrontmatterDocument(editor, content, isOwnSave)

	useMarkdownAutosave({ editor, isVSCodeContext, saveContent: save })

	const { analysis, isAnalyzing } = useTextTools({
		editor,
		enabled: viewOptions.textTools,
		rules: viewOptions.textToolRules,
		targetAge: settings.textToolsTargetAge,
	})

	useItalicMarker(editor, settings.italicMarker)
	const codeBlockStyle = useSyntaxHighlight(editor)

	return {
		editor,
		analysis,
		isAnalyzing,
		codeBlockStyle,
	}
}
