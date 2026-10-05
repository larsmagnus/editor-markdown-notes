import { mountVisimer } from '#src/editor/extensions/mermaid/visual-editor/mount-visimer'
import type {
	MountedVisimer,
	MountVisimerOptions,
} from '#src/editor/extensions/mermaid/visual-editor/mount-visimer'

/**
 * Mounts visimer without waiting for it, for a caller that may be torn down
 * first: a canvas that arrives after `stop` is destroyed on arrival.
 *
 * @returns tears down whatever has been mounted so far.
 */
export function startVisimer(
	options: MountVisimerOptions,
	onMounted: (mounted: MountedVisimer) => void,
	onFailure: (error: unknown) => void
): () => void {
	let stopped = false
	let destroy = () => {}

	mountVisimer(options)
		.then((mounted) => {
			if (stopped) return mounted.destroy()

			destroy = mounted.destroy
			onMounted(mounted)
		})
		.catch(onFailure)

	return () => {
		stopped = true
		destroy()
	}
}
