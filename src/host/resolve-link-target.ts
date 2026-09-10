import * as path from 'path'

import * as vscode from 'vscode'

import { splitHrefHash } from '#src/lib/host/split-href-hash'

export type ResolvedLinkTarget = { uri: vscode.Uri } | { error: string }

/**
 * Resolves a link's href to a filesystem target, following the same dual-base
 * convention `image-base-uris.ts` uses for images: a leading `/` resolves
 * against the document's workspace folder, everything else against the
 * document's own folder.
 *
 * Unlike the image resolver, a leading-`/` link with no workspace folder to
 * resolve against is an error rather than a silent fallback to
 * relative-to-file - reinterpreting an absolute-from-root link that way would
 * be a confusing bug in a file-open, not the harmless default an unreachable
 * image already is.
 */
export async function resolveLinkTarget(
	href: string,
	document: vscode.TextDocument
): Promise<ResolvedLinkTarget> {
	const { path: rawPath } = splitHrefHash(href)
	if (!rawPath) return { error: 'This link has no target.' }

	const decodedPath = decodeLinkPath(rawPath)

	const resolvedPath = decodedPath.startsWith('/')
		? resolveAgainstWorkspace(decodedPath, document)
		: path.resolve(path.dirname(document.uri.fsPath), decodedPath)

	if (typeof resolvedPath !== 'string') return resolvedPath

	try {
		await vscode.workspace.fs.stat(vscode.Uri.file(resolvedPath))
	} catch {
		return { error: `${path.basename(resolvedPath)} does not exist.` }
	}

	return { uri: vscode.Uri.file(resolvedPath) }
}

/** A malformed `%` escape is treated as a literal character rather than thrown. */
function decodeLinkPath(rawPath: string): string {
	try {
		return decodeURIComponent(rawPath)
	} catch {
		return rawPath
	}
}

function resolveAgainstWorkspace(
	decodedPath: string,
	document: vscode.TextDocument
): string | { error: string } {
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
	if (!workspaceFolder) {
		return { error: 'This link points outside any open workspace folder.' }
	}

	return path.join(workspaceFolder.uri.fsPath, decodedPath.slice(1))
}
