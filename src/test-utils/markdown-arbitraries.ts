import fc from 'fast-check'

const WORDS = ['Ship', 'it', 'the', 'plan', 'note', 'today', '2026', 'v2']

const DELIMITERS = [
	'*',
	'**',
	'***',
	'_',
	'__',
	'~',
	'~~',
	'`',
	'``',
	'```',
	'[',
	']',
	'(',
	')',
	'![',
	'](',
	'<',
	'>',
	'\\',
	'|',
	'#',
	'!',
	'&',
	':',
]

const SPACES = [' ', ' ', ' ', '  ', '\t', ' ', '​']

const EXOTIC = ['😀', '👨‍👩‍👧', 'é', 'é', 'שלום', '𝕏', '漢字']

const FRAGMENTS = [
	'https://example.com',
	'[link](https://example.com)',
	'![image](./image.png)',
	'`code`',
	'**bold**',
	'_italic_',
	'~~strike~~',
	'<kbd>Ctrl</kbd>',
	'&amp;',
	'snake_case_name',
	'2*3*4',
]

/** One run of inline markdown: words, delimiters, whitespace and unicode in any order. */
function inlineMarkdown(): fc.Arbitrary<string> {
	return fc
		.array(
			fc.oneof(
				{ weight: 4, arbitrary: fc.constantFrom(...WORDS) },
				{ weight: 3, arbitrary: fc.constantFrom(...SPACES) },
				{ weight: 3, arbitrary: fc.constantFrom(...DELIMITERS) },
				{ weight: 2, arbitrary: fc.constantFrom(...FRAGMENTS) },
				{ weight: 1, arbitrary: fc.constantFrom(...EXOTIC) }
			),
			{ minLength: 1, maxLength: 12 }
		)
		.map((parts) => parts.join(''))
}

const INDENTS = ['', '', '', '  ', '   ', '    ', '\t']

const LIST_MARKERS = [
	'- ',
	'* ',
	'+ ',
	'1. ',
	'2) ',
	'10. ',
	'- [ ] ',
	'- [x] ',
	'-',
	'- ',
]

const BLOCK_ONLY_LINES = [
	'',
	'',
	'---',
	'***',
	'___',
	'- - -',
	'===',
	'```',
	'```js',
	'~~~',
	'````',
	'| a | b |',
	'|---|---|',
	'| 1 |',
	'<div>',
	'</div>',
	'<!-- comment -->',
	'<details>',
	'[ref]: https://example.com',
	'> [!NOTE]',
	'$$',
]

/** One line of block-level markdown, well-formed or not. */
function markdownLine(): fc.Arbitrary<string> {
	return fc.oneof(
		{ weight: 4, arbitrary: inlineMarkdown() },
		{ weight: 3, arbitrary: fc.constantFrom(...BLOCK_ONLY_LINES) },
		{
			weight: 2,
			arbitrary: fc
				.tuple(fc.integer({ min: 1, max: 7 }), inlineMarkdown())
				.map(([level, text]) => `${'#'.repeat(level)} ${text}`),
		},
		{
			weight: 3,
			arbitrary: fc
				.tuple(
					fc.constantFrom(...INDENTS),
					fc.constantFrom(...LIST_MARKERS),
					inlineMarkdown()
				)
				.map(([indent, marker, text]) => `${indent}${marker}${text}`),
		},
		{
			weight: 2,
			arbitrary: fc
				.tuple(fc.integer({ min: 1, max: 3 }), inlineMarkdown())
				.map(([depth, text]) => `${'> '.repeat(depth)}${text}`),
		}
	)
}

/** A whole note of arbitrary lines, LF-terminated or not. */
export function markdownDocument(): fc.Arbitrary<string> {
	return fc
		.tuple(fc.array(markdownLine(), { maxLength: 25 }), fc.boolean())
		.map(
			([lines, finalNewline]) => lines.join('\n') + (finalNewline ? '\n' : '')
		)
}
