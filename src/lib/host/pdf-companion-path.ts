/**
 * The markdown file a PDF's extracted text lives in - `report.pdf` becomes
 * `report.pdf.md`, sitting alongside the PDF rather than replacing its
 * extension, so a later re-open can tell whether that file already exists
 * without touching the original PDF.
 */
export function companionPathFor(pdfPath: string): string {
	return `${pdfPath}.md`
}
