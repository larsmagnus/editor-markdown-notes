import * as nodePath from 'path'

/**
 * The path a picked image gets inserted as, relative to the document's own
 * folder - the same base `resolveImageSrc` resolves a relative `src`
 * against, so markdown reads the same way whether the author typed the path
 * or picked it. POSIX-separated even on Windows, since that is what markdown
 * syntax expects.
 */
export function relativeImagePath(
	documentPath: string,
	pickedPath: string
): string {
	return nodePath
		.relative(nodePath.dirname(documentPath), pickedPath)
		.split(nodePath.sep)
		.join('/')
}
