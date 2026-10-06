/** Calls `onChange` for any change to `root`'s content or size, until
 *  disconnected. */
export function observeChanges(root: HTMLElement, onChange: () => void) {
	const mutations = new MutationObserver(onChange)
	mutations.observe(root, {
		childList: true,
		subtree: true,
		characterData: true,
	})
	const resizes = new ResizeObserver(onChange)
	resizes.observe(root)

	return {
		disconnect: () => {
			mutations.disconnect()
			resizes.disconnect()
		},
	}
}
