import type { Content, Extensions } from '@tiptap/core'
import { Editor } from '@tiptap/core'

import { buildExtensions } from '#src/editor/extensions/build-extensions'
import { loadNoteContent } from '#src/editor/load-note-content'
import { createMountPoint } from '#src/test-utils/mount-point'

type EditorOptions = {
	/** Defaults to the app's own list; `[StarterKit]` for schema-level tests. */
	extensions?: Extensions
	/** Attach to the document, for anything that reads real elements. */
	mount?: boolean
	/**
	 * Parse `content` in the constructor rather than loading it through
	 * `setContent`, for a test asserting on what parsing alone produces. The two
	 * are different documents: `<h1>A heading</h1>` gains a trailing paragraph on
	 * the way through `setContent`, which is why dropping this option from a call
	 * site is a change to what that test says, not a tidy-up.
	 */
	parseOnly?: boolean
}

/**
 * Whether `content` is a note's markdown for the app's own schema - HTML and
 * JSON content, and schema-level tests' bare extension lists, load through
 * `setContent` instead.
 */
function isNote(editor: Editor, content: Content): content is string {
	return (
		typeof content === 'string' &&
		!content.trimStart().startsWith('<') &&
		'blockSource' in editor.storage
	)
}

/**
 * An editor holding `content`, loaded the way `editor.tsx` loads a note.
 *
 * Loading through `loadNoteContent` is the point: it completes the parse the
 * way the app does - delimiter text, untouched blocks remembered - so a test
 * that skips it asserts on a document the app never actually has.
 *
 * Nothing here registers teardown. `test-setup.ts` destroys every editor after
 * every test, so a test file needs no `afterEach` of its own.
 */
export function createEditor(
	content: Content = '',
	{
		extensions = buildExtensions('markdown'),
		mount = false,
		parseOnly = false,
	}: EditorOptions = {}
): Editor {
	const editor = new Editor({
		extensions,
		content: parseOnly ? content : '',
		...(mount && { element: createMountPoint() }),
	})
	if (parseOnly) return editor

	if (isNote(editor, content)) {
		loadNoteContent(editor, content, {
			fileKind: editor.schema.nodes.frontmatter ? 'markdown' : 'txt',
			addToHistory: false,
		})
	} else {
		editor.commands.setContent(content)
	}

	return editor
}

/**
 * An editor holding `markdown` loaded exactly as the app loads a note - even
 * text that starts with `<`, which `createEditor` reads as HTML.
 */
export function openNote(markdown: string, { mount = false } = {}): Editor {
	const editor = new Editor({
		extensions: buildExtensions('markdown'),
		...(mount && { element: createMountPoint() }),
	})
	loadNoteContent(editor, markdown, {
		fileKind: 'markdown',
		addToHistory: false,
	})
	return editor
}

/** What the note would be saved as right now. */
export function saved(editor: Editor): string {
	return String(editor.storage.markdown.getMarkdown()).trimEnd()
}

/**
 * Presses a key the way the browser does, so the keymap plugins see it.
 *
 * The alternative, `editor.commands.keyboardShortcut`, is not a test of the
 * keystroke at all - see CLAUDE.md on what it silently reverts, and on which
 * key behaviours only `e2e/` can observe.
 */
export function press(
	editor: Editor,
	key: string,
	{ shift = false }: { shift?: boolean } = {}
): void {
	editor.view.dom.dispatchEvent(
		new KeyboardEvent('keydown', { key, shiftKey: shift, bubbles: true })
	)
}
