import { copyToClipboard } from '#src/lib/clipboard'

/**
 * Copies the draw.io diagram a `.drawio.svg` carries as a mermaid flowchart.
 *
 * The file is fetched here because an `<img>` never exposes what it loaded,
 * and the converter is imported on demand since most images are never
 * exported. A failure is reported rather than thrown so the click never ends
 * in an unhandled rejection, and `onCopied` only runs for a copy that happened.
 */
export async function copyDrawioSvgAsMermaid(
	url: string,
	onCopied: () => void
) {
	try {
		const response = await fetch(url)
		if (!response.ok) throw new Error(`${url} responded ${response.status}`)

		const [{ readDrawioXml }, { drawioToMermaid }] = await Promise.all([
			import('#src/editor/extensions/image/drawio/read-drawio-xml'),
			import('#src/editor/extensions/image/drawio/drawio-to-mermaid'),
		])
		const xml = await readDrawioXml(await response.text())
		if (!xml) throw new Error('The image carries no draw.io diagram')

		const mermaid = drawioToMermaid(xml)
		if (!mermaid) throw new Error('The diagram has no nodes to convert')

		if (await copyToClipboard(mermaid)) onCopied()
	} catch (error) {
		console.error('Could not copy the diagram as Mermaid:', error)
	}
}
