/**
 * Mermaid names an edge `L_<from>_<to>_<n>`, and either name may itself hold
 * underscores, so the split is the one where both halves are known vertices.
 */
export function endpointsOf(dataId: string, names: ReadonlySet<string>) {
	const parts = dataId.replace(/^L_/, '').replace(/_\d+$/, '').split('_')
	return parts
		.slice(1)
		.map((_, index) => [
			parts.slice(0, index + 1).join('_'),
			parts.slice(index + 1).join('_'),
		])
		.find(([from, to]) => names.has(from ?? '') && names.has(to ?? ''))
}
