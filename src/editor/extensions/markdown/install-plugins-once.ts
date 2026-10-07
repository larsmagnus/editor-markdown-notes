import type { MarkdownIt } from 'markdown-it'

/**
 * Makes `md.use` install each plugin once, however often it is asked.
 *
 * `tiptap-markdown` runs every extension's parse setup on every parse, and
 * the task list's setup is `md.use(plugin)` - which adds the plugin's rule
 * again each time. A long session accumulated a copy per parse, each run on
 * every later parse, and the parser grew slower and heavier with every note
 * loaded or outside change taken in.
 */
export function installPluginsOnce(md: MarkdownIt): void {
	const used = new Set<unknown>()
	const use = md.use.bind(md)
	md.use = ((
		plugin: Parameters<MarkdownIt['use']>[0],
		...options: unknown[]
	) => {
		if (used.has(plugin)) return md
		used.add(plugin)
		return use(plugin, ...options)
	}) as MarkdownIt['use']
}
