/**
 * Where AI tools keep their rules, plans and memory. Gitignored more often than
 * not, yet they are notes the author wrote or reads, so the index keeps them in
 * view despite `.gitignore`. Matched at any depth for monorepo packages. A root
 * `CLAUDE.md` is left out: it is an ordinary note, not a tool's own territory.
 */
const AI_TOOL_PATH_PATTERNS = [
	/(^|\/)\.(claude|cursor|windsurf|codex|gemini|continue|agents|roo|cline)\//,
	/(^|\/)\.aider[./]/,
	/(^|\/)\.github\/copilot-/,
	/(^|\/)\.github\/instructions\//,
]

/** Whether a workspace-relative, forward-slash path sits in an AI tool's own territory. */
export function isAiToolPath(relativePath: string): boolean {
	return AI_TOOL_PATH_PATTERNS.some((pattern) => pattern.test(relativePath))
}
