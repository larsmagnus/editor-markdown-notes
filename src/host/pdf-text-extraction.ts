import { getDocument, VerbosityLevel } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { WorkerMessageHandler } from 'pdfjs-dist/legacy/build/pdf.worker.mjs'

/**
 * pdfjs-dist always looks for a worker to do the parsing, even in Node,
 * where there is no separate thread to run one on. Assigning its message
 * handler onto `globalThis.pdfjsWorker` is the documented escape hatch:
 * `PDFWorker` checks for it before falling back to a dynamic `import()` of a
 * worker script by path, which would need `pdf.worker.mjs` shipped and
 * located as a sibling file at runtime. Setting the global instead lets the
 * worker's code ride along as a plain static import, bundled into the same
 * output file as everything else.
 */
;(globalThis as Record<string, unknown>).pdfjsWorker = { WorkerMessageHandler }

/**
 * Extracts a PDF's text, one paragraph per page, with no structural
 * inference (headings, lists, tables) - each page's `getTextContent()` items
 * are joined with spaces, and pages are joined with an HTML-comment
 * separator so paragraphs from different pages never read as adjoined.
 */
export async function extractPdfText(bytes: Uint8Array): Promise<string> {
	const doc = await getDocument({
		data: bytes,
		verbosity: VerbosityLevel.ERRORS,
	}).promise

	const pages: string[] = []
	for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
		const page = await doc.getPage(pageNumber)
		const textContent = await page.getTextContent()
		const text = textContent.items
			.map((item) => ('str' in item ? item.str : ''))
			.join(' ')
		pages.push(text)
	}

	return pages
		.map((text, index) =>
			index === 0 ? text : `\n\n<!-- page ${index + 1} -->\n\n${text}`
		)
		.join('')
}
