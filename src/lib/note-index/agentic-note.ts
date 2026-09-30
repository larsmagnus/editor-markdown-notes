/** The tag an agentic note carries, alongside its frontmatter tags. */
export const AGENTIC_TAG = 'agentic'

/** Folders that AI coding tools read their instructions, skills and rules from. */
const AGENTIC_DIRECTORIES = new Set([
	'.claude',
	'.agents',
	'.codex',
	'.cursor',
	'.gemini',
	'.windsurf',
	'.clinerules',
	'.roo',
	'.kiro',
	'.continue',
	'.opencode',
	'.junie',
	'.amazonq',
	'.augment',
])

/**
 * `.github` holds plenty that is not for agents, so only Copilot's own
 * subfolders count.
 */
const AGENTIC_GITHUB_DIRECTORIES = new Set([
	'instructions',
	'prompts',
	'agents',
	'chatmodes',
])

/** Instruction files AI tools look for by name, wherever they sit. */
const AGENTIC_FILE_NAMES = new Set([
	'agents.md',
	'agent.md',
	'claude.md',
	'claude.local.md',
	'gemini.md',
	'copilot-instructions.md',
	'llms.txt',
	'llms-full.txt',
])

/**
 * Whether a note is written for AI coding tools rather than for people -
 * judged by where it lives or what it is called, since such files rarely say
 * so in their content.
 */
export function isAgenticNote(directory: string, fileName: string): boolean {
	if (AGENTIC_FILE_NAMES.has(fileName.toLowerCase())) return true

	const segments = directory.split('/')
	return segments.some(
		(segment, index) =>
			AGENTIC_DIRECTORIES.has(segment) ||
			(segment === '.github' &&
				AGENTIC_GITHUB_DIRECTORIES.has(segments[index + 1] ?? ''))
	)
}
