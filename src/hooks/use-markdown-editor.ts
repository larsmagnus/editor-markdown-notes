import { useEditor } from '@tiptap/react'

import { extensions } from '@/editor/extensions'
import { useFrontmatterDocument } from '@/hooks/use-frontmatter-document'
import { useHostDocument } from '@/hooks/use-host-document'
import { useItalicMarker } from '@/hooks/use-italic-marker'
import { useMarkdownAutosave } from '@/hooks/use-markdown-autosave'
import { useSettings } from '@/hooks/use-settings'
import { useTextTools } from '@/hooks/use-text-tools'
import { splitFrontmatter } from '@/lib/frontmatter'

/**
 * Everything the editor needs to run one note: the TipTap instance, its
 * frontmatter, autosaving, the writing checks and the live italic marker.
 *
 * Composed here rather than in the component so the component is only layout,
 * and so the order these depend on each other is stated once.
 */
export function useMarkdownEditor(content: string) {
	const { viewOptions, settings, isVSCodeContext } = useSettings()
	const { saveContent } = useHostDocument()

	const editor = useEditor({
		extensions,
		content: splitFrontmatter(content).body,
		autofocus: 'end',
	})

	const { frontmatter, setFrontmatter } = useFrontmatterDocument(
		editor,
		content
	)

	const { queueSave } = useMarkdownAutosave({
		editor,
		frontmatter,
		isVSCodeContext,
		saveContent,
	})

	const { analysis, isAnalyzing } = useTextTools({
		editor,
		enabled: viewOptions.textTools,
		rules: viewOptions.textToolRules,
		targetAge: settings.textToolsTargetAge,
	})

	useItalicMarker(editor, settings.italicMarker)

	// Editing the panel changes what gets written without touching the document,
	// so the save has to be queued by hand.
	const handleFrontmatterChange = (nextFrontmatter: string) => {
		setFrontmatter(nextFrontmatter)
		queueSave(editor?.storage?.markdown?.getMarkdown() ?? '', nextFrontmatter)
	}

	return { editor, frontmatter, handleFrontmatterChange, analysis, isAnalyzing }
}
