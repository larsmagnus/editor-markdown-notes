import Document from '@tiptap/extension-document'

import {
	SHARED_HEAD_EXTENSIONS,
	SHARED_TAIL_EXTENSIONS,
} from '#src/editor/extensions/extensions'
import { Frontmatter } from '#src/editor/extensions/frontmatter/frontmatter-extension'
import type { FileKind } from '#src/lib/file-kind'
import { supportsFrontmatter } from '#src/lib/file-kind'

/**
 * The TipTap schema the editor runs on, for the given file kind.
 */
export function buildExtensions(fileKind: FileKind) {
	const hasFrontmatter = supportsFrontmatter(fileKind)

	return [
		...SHARED_HEAD_EXTENSIONS,
		// `frontmatter?` first, so the schema itself enforces "at most one, always
		// the document's first child" - no `appendTransaction` policing needed.
		Document.extend({
			content: hasFrontmatter ? 'frontmatter? block+' : 'block+',
		}),
		...(hasFrontmatter ? [Frontmatter] : []),
		...SHARED_TAIL_EXTENSIONS,
	]
}
