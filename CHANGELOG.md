# Change Log

All notable changes to the "editor-markdown-notes" extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.17.0] - 2026-08-09

- Added editing to the raw markdown view, which autosaves and saves on Cmd/Ctrl+S like the rich editor
- Changed a failure in the toolbar, the document, the writing tools or a diagram to show an error with a Try again button instead of blanking the panel
- Fixed the editor going blank when switching to a note with fewer diagrams
- Fixed an emptied note never being saved
- Fixed switching demo notes quickly leaving the previous note on screen
- Fixed the heading buttons not announcing their level to screen readers

## [0.16.2] - 2026-08-08

- Enable VSCode's native find widget (Cmd/Ctrl+F) inside the editor panel

## [0.16.1] - 2026-08-08

- Fix markdown escaping bugs that corrupted saved files: unnecessary backslashes before headings/brackets, tildes, and unrelated asterisks/backticks, plus a `[label]: url`-shaped line silently disappearing on reload
- **Preserve the italic marker (`_` or `*`) a file was already using** instead of always rewriting it to `*` on save, and add an `editorMarkdownNotes.italicMarker` setting for which marker fresh italics (toolbar, bubble menu, Cmd/Ctrl+I) use

## [0.16.0] - 2026-08-08

- **Add `editor-markdown-notes.toggleHideToolbar` command**, and rename the `editorMarkdownNotes.hideNav` setting to `editorMarkdownNotes.hideToolbar` (it hides a toolbar, not a navigation bar)

## [0.15.0] - 2026-08-07

- Switch the frontmatter panel to a proper `<textarea>` (shadcn) instead of a plain input, so multi-line frontmatter values are usable

## [0.14.0] - 2026-08-07

- **Add writing tools sidebar**: flags passive voice, weak words, words that could be simpler, and sentences that are hard to read against a configurable target reading age, decorating findings inline and jumping to them on click

## [0.13.1] - 2026-08-07

- Fix bubble menu colors

## [0.13.0] - 2026-08-07

- **Support frontmatter:** Keep YAML frontmatter out of the TipTap document entirely, editing it as raw text in its own panel above the note, so a leading `---` block no longer gets parsed and mangled as an `<hr>` on save

## [0.12.0] - 2026-08-07

- **Support Mermaid diagrams** in fenced ` ```mermaid ` code blocks, showing the diagram until the caret moves into the block and the source while editing

## [0.11.1] - 2026-08-07

- Fix the nav bar rendering underneath the editor content

## [0.11.0] - 2026-08-07

- **Logging and error handling:** Add an **Editor Markdown Notes: Show logs** output channel that reports webview failures (blocked scripts, thrown modules, rejected promises, a panel that renders nothing) that would otherwise only show up as a blank panel

## [0.10.5] - 2026-08-07

- Fix the panel loading blank in some cases due to a circular chunk dependency between TipTap and ProseMirror, and stop zod's CSP-blocked JIT parser probe from logging a spurious CSP violation on every load

## [0.10.4] - 2026-08-07

- Fix spacing on task list items

## [0.10.3] - 2026-08-07

- **Performance improvements:** Code-split the webview bundle into cacheable vendor chunks and lazy-load the nav, and make the dev-only file selector tree-shake out of production builds

## [0.10.2] - 2026-08-07

- **Support images** referenced from markdown inside the VS Code extension, resolving relative and root-absolute paths the same way VS Code's own markdown preview does

## [0.10.1] - 2026-08-07

- Fix table cell content wrapping in an unwanted paragraph

## [0.10.0] - 2026-08-06

- **Support markdown tables, task lists, and images**, which previously rendered as plain text or were silently dropped (and lost) on the next auto-save

## [0.9.0] - 2026-08-06

- Add a settings provider to sync view options and VS Code configuration across the webview

## [0.8.0] - 2026-08-06

- Validate stored and received view options with zod, so malformed local storage or host messages degrade to defaults instead of blanking the editor

## [0.7.1] - 2026-08-06

- Escape `<` when injecting document content into the webview, so a markdown file containing `</script>` no longer loads blank

## [0.7.0] - 2026-08-06

- Persist the raw, full-width and theme toggles across editor tabs and sessions, and add the `editorMarkdownNotes.centerContent` and `editorMarkdownNotes.hideNav` settings

## [0.6.0] - 2026-08-06

- Add the host/webview message contract shared between the extension and the React app

## [0.5.0] - 2025-08-04

- **Support local VS Code extension installation** as a `.vsix` for development

## [0.4.0] - 2025-08-04

- Initial working custom editor, replacing the extension scaffold

## [0.3.0] - 2025-08-04

- Set the color theme on the React root, since a VS Code extension doesn't control the surrounding page body

## [0.2.0] - 2025-08-04

- Fit the bubble/floating menu to its content

## [0.1.0] - 2025-08-04

- Initial project scaffold
