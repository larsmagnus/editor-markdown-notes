/**
 * Hand-maintained terms the generated wordlist lacks or gets wrong.
 *
 * Unlike `technical-terms.generated.ts` this file is edited by hand and ships
 * to every user. Case is exact for acronyms and proper names (`SVG`, `Vite`);
 * lowercase entries also match their sentence-initial form.
 */
export const CURATED_TERMS: string[] = [
	// Formats and acronyms
	'CJS',
	'CSP',
	'E2E',
	'ESM',
	'GFM',
	'JSX',
	'MCP',
	'SVG',
	'TSX',

	// Tools and libraries
	'ProseMirror',
	'Shiki',
	'TipTap',
	'Vite',
	'retext',
	'shadcn',
	'zod',

	// Markdown and editor vocabulary
	'autofocus',
	'backtick',
	'backticks',
	'blockquote',
	'blockquotes',
	'checkbox',
	'checkboxes',
	'formatter',
	'frontmatter',
	'getters',
	'parser',
	'parsers',
]
