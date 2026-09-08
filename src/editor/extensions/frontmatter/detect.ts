import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Fragment } from '@tiptap/pm/model'
import { Selection } from '@tiptap/pm/state'
import type { EditorState, Transaction } from '@tiptap/pm/state'

import { frontmatterFenceText } from '#src/editor/extensions/frontmatter/frontmatter-fence'

/**
 * A paragraph made only of text (and marks) - the shape a line of typed YAML
 * takes. Images are inline nodes, so a paragraph holding one still passes a
 * type-name check; this is what actually excludes it.
 */
function isPlainParagraph(node: ProseMirrorNode): boolean {
	if (node.type.name !== 'paragraph') return false

	let plain = true
	node.forEach((inline) => {
		if (!inline.isText) plain = false
	})
	return plain
}

/**
 * Promotes a typed `---`/content/`---` block at the top of the document into a
 * real `frontmatter` node the instant the closing fence completes.
 *
 * The pattern to catch is `horizontalRule → content → horizontalRule`, not a
 * text pattern: markdown-it has already turned each bare `---` into its own
 * block node by the time this runs. A document that genuinely opens with two
 * rules around plain text is indistinguishable by shape and gets promoted too.
 */
export function detectFrontmatter(state: EditorState): Transaction | null {
	const { doc, schema } = state
	const hr = schema.nodes.horizontalRule
	const frontmatter = schema.nodes.frontmatter
	if (!hr || !frontmatter) return null
	if (doc.firstChild?.type !== hr) return null

	let closingIndex = -1
	let closingPos = -1
	let pos = doc.firstChild.nodeSize
	let allPlain = true

	for (let index = 1; index < doc.childCount; index += 1) {
		const child = doc.child(index)
		if (child.type === hr) {
			closingIndex = index
			closingPos = pos
			break
		}
		if (!isPlainParagraph(child)) allPlain = false
		pos += child.nodeSize
	}

	// No closing fence yet - still typing.
	if (closingIndex === -1) return null

	// Anything richer than plain paragraphs is far likelier to be real content
	// sitting above an unrelated horizontal rule than intentional YAML, and
	// sweeping it in would swallow real structure. Only the typed fence becomes
	// an empty frontmatter block; everything else is left as it was.
	if (!allPlain) {
		const node = frontmatter.create(null, schema.text(frontmatterFenceText('')))
		const tr = state.tr.replaceWith(0, doc.firstChild.nodeSize, node)
		tr.setSelection(Selection.near(tr.doc.resolve(node.nodeSize)))
		return tr
	}

	const lines: string[] = []
	for (let index = 1; index < closingIndex; index += 1) {
		lines.push(doc.child(index).textContent)
	}
	const text = lines.join('\n')

	const end = closingPos + doc.child(closingIndex).nodeSize
	const node = frontmatter.create(null, schema.text(frontmatterFenceText(text)))

	// `block+` requires at least one block after frontmatter - a document that
	// was nothing but the typed pattern needs an empty paragraph to stay valid.
	const replacement =
		end < doc.content.size
			? node
			: Fragment.from([node, schema.nodes.paragraph.create()])

	const tr = state.tr.replaceWith(0, end, replacement)
	tr.setSelection(Selection.near(tr.doc.resolve(node.nodeSize)))
	return tr
}
