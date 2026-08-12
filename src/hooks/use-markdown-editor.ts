import { useEditor } from '@tiptap/react'

import { extensions } from '@/editor/extensions'
import { useFrontmatterDocument } from '@/hooks/use-frontmatter-document'
import { useHostDocument } from '@/hooks/use-host-document'
import { useItalicMarker } from '@/hooks/use-italic-marker'
import { useMarkdownAutosave } from '@/hooks/use-markdown-autosave'
import { useSettings } from '@/hooks/use-settings'
import { useSyntaxHighlight } from '@/hooks/use-syntax-highlight'
import { useTextTools } from '@/hooks/use-text-tools'
import { splitFrontmatter } from '@/lib/frontmatter'

/**
 * Everything the editor needs to run one note: the TipTap instance, autosaving,
 * the writing checks and the live italic marker.
 *
 * Composed here rather than in the component so the component is only layout,
 * and so the order these depend on each other is stated once.
 */
export function useMarkdownEditor(content: string) {
	const { viewOptions, settings, isVSCodeContext } = useSettings()
	const { saveContent } = useHostDocument()

	const editor = useEditor({
		extensions,
		// markdown-it has no concept of frontmatter and would parse `---` as an
		// `<hr>`, so the initial content is body-only - `useFrontmatterDocument`
		// inserts the frontmatter node right after mount, the same way it
		// rebuilds the doc for any later incoming change.
		content: splitFrontmatter(content).body,
		autofocus: 'end',
	})

	useFrontmatterDocument(editor, content)

	useMarkdownAutosave({ editor, isVSCodeContext, saveContent })

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
