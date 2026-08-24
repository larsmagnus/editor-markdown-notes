/**
 * Whether the `TextDocument` is known to be dirty, mirrored from the host
 * rather than queried - the webview has no direct way to read
 * `TextDocument.isDirty`.
 *
 * Module-scoped, like `skipToEditorRef` (`skip-target.ts`): each webview
 * panel is its own JS realm, so this needs no further scoping of its own,
 * and a panel is bound to exactly one document for its whole life.
 *
 * VS Code does not save a clean document - a keystroke landing inside the
 * sync debounce, before anything has actually reached the `TextDocument`,
 * would make Cmd/Ctrl+S (and `files.autoSave`) a silent no-op. `use-note-
 * sync.ts` reads this to sync the very first edit since clean immediately,
 * ahead of the debounce, so the document is dirty the moment typing starts.
 */
export const documentDirty = { current: false }
