import type { Content, Extensions } from '@tiptap/core'
import { Editor } from '@tiptap/core'

import { extensions as appExtensions } from '@/editor/extensions/extensions'
import { createMountPoint } from '@/test-utils/mount-point'

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
 * An editor holding `content`, loaded the way `editor.tsx` loads a note.
 *
 * Loading through `setContent` is the point: it runs the plugins - marker
 * repair, delimiter sync - that constructing does not, so a test that skips it
 * asserts on a document the app never actually has.
 *
 * Nothing here registers teardown. `test-setup.ts` destroys every editor after
 * every test, so a test file needs no `afterEach` of its own.
 */
export function createEditor(
	content: Content = '',
	{
		extensions = appExtensions,
		mount = false,
		parseOnly = false,
	}: EditorOptions = {}
): Editor {
	const editor = new Editor({
		extensions,
		content: parseOnly ? content : '',
		...(mount && { element: createMountPoint() }),
	})
	if (!parseOnly) editor.commands.setContent(content)

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
