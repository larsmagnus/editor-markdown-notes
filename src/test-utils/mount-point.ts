/**
 * Where a test's editor attaches, for the tests that need real elements to
 * measure. Its own module, and deliberately free of imports: `test-setup.ts`
 * removes these after every test, and pulling the editor's extension tree into
 * the setup file would load the whole app ahead of any `vi.mock`.
 */
const MOUNT_TEST_ID = 'editor-mount'

export const MOUNT_SELECTOR = `[data-testid="${MOUNT_TEST_ID}"]`

/** Removed after every test by `test-setup.ts`, along with the editor on it. */
export function createMountPoint(): HTMLElement {
	const element = document.createElement('div')
	element.dataset.testid = MOUNT_TEST_ID

	return document.body.appendChild(element)
}
