import { useEditor } from '@tiptap/react'
import { useCallback, useRef } from 'react'

import {
	EDITOR_KEYBOARD_HINT_ID,
	LIVE_EDITOR_ID,
} from '@/editor/editor-mode-live-surface'
import { extensions } from '@/editor/extensions/extensions'
import { useFocusNavigation } from '@/editor/extensions/focus-navigation/use-focus-navigation'
import { useAskProposal } from '@/hooks/use-ask-proposal'
import { useFrontmatterDocument } from '@/hooks/use-frontmatter-document'
import { useItalicMarker } from '@/hooks/use-italic-marker'
import { useMarkdownAutosave } from '@/hooks/use-markdown-autosave'
import { useSearchReveal } from '@/hooks/use-search-reveal'
import { useSettings } from '@/hooks/use-settings'
import { useSyntaxHighlight } from '@/hooks/use-syntax-highlight'
import { useTextTools } from '@/hooks/use-text-tools'
import { splitFrontmatter } from '@/lib/host/frontmatter'

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
		// A note has to open where the reader left it (`useScrollPosition`), and
		// any autofocus scrolls its caret into view over that. `'end'` also put a
		// freshly opened note at the bottom of the document rather than the top,
		// and `'start'` would open a note beginning with a diagram or code block
		// showing that block's source - `useCaretInside` reveals whichever block
		// holds the caret.
		autofocus: false,
		editorProps: {
			// Make space for toolbar + bubble menu
			scrollMargin: 110,
			// Set here, not as props on `<EditorContent>`, so they land on
			// `view.dom` itself rather than TipTap's wrapper div. `role` is
			// explicit: TipTap only adds its own `role="textbox"` default when
			// nothing here already provides an `attributes` object.
			attributes: {
				role: 'textbox',
				id: LIVE_EDITOR_ID,
				spellcheck: 'false',
				'aria-describedby': EDITOR_KEYBOARD_HINT_ID,
			},
		},
	})

	useFrontmatterDocument(editor, content, isOwnSave)
	useFocusNavigation(editor)

	// After the rebuild above, which is what puts the note's real text in the
	// document - searching the doc it was constructed with would miss the
	// frontmatter and race the only content sync this note ever gets for free.
	useSearchReveal(editor)

	useMarkdownAutosave({ editor, isVSCodeContext, saveContent: save })

	const { analysis, isAnalyzing, hasSpellingFailed } = useTextTools({
		editor,
		enabled: viewOptions.textTools,
		rules: viewOptions.textToolRules,
		targetAge: settings.textToolsTargetAge,
		spellingLanguage: viewOptions.spellingLanguage,
		spellingIgnoreWords: viewOptions.spellingIgnoreWords,
	})

	useItalicMarker(editor, settings.italicMarker)
	const codeBlockStyle = useSyntaxHighlight(editor)
	useAskProposal(editor)

	return {
		editor,
		analysis,
		isAnalyzing,
		hasSpellingFailed,
		codeBlockStyle,
	}
}
