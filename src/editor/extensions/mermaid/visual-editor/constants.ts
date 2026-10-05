/**
 * Marks the visual editor's whole frame, so the code block node view can tell
 * its events apart from the document's: ProseMirror would otherwise take every
 * click and keystroke inside it for its own and steal the focus.
 */
export const VISUAL_EDITOR_ATTRIBUTE = 'data-visual-editor'

/** Visimer names flowchart nodes `node:<id>`; only those can have a successor. */
export const NODE_ENTITY_PREFIX = 'node:'
