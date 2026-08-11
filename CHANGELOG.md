# Change Log

All notable changes to the "editor-markdown-notes" extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Added editing images in the live editor: drag to move, edit the source and alt text, add or remove a link, delete, and navigate them by keyboard

## [0.18.1] - 2026-08-11

- Changed the extension package to install around 60% smaller

## [0.18.0] - 2026-08-11

- Added syntax highlighting to code blocks in the live editor, matching your active VS Code color theme
- Added a copy button to code blocks in the live editor
- Added a Text Editor button that reopens the file in VSCode's built-in text editor
- Added row and column handles to tables in the live editor, with a menu for adding, deleting, moving and aligning
- Added dragging a table handle to reorder its row or column
- Added column alignment to tables, which now survives a save instead of being dropped when the note loads
- Added copying table cells as a markdown table
- Added pasting a table from another editor or a spreadsheet
- Added arrow key movement between table cells and out of the table
- Added Shift+arrow keys to select whole table cells
- Changed Backspace over selected table cells to empty them, or remove the row or column when all of one is selected
- Changed the raw markdown toggle into three buttons: Text Editor, Raw Editor, Live Editor
- Fixed a `|` typed into a table cell splitting it into two cells on save
- Fixed a table cell holding only an image being emptied on save

## [0.17.0] - 2026-08-09

- Added editing to the raw markdown view, which autosaves and saves on Cmd/Ctrl+S like the rich editor
- Changed a failure in the toolbar, the document, the writing tools or a diagram to show an error with a Try again button instead of blanking the panel
- Fixed the editor going blank when switching to a note with fewer diagrams
- Fixed an emptied note never being saved
- Fixed switching demo notes quickly leaving the previous note on screen
- Fixed the heading buttons not announcing their level to screen readers

## [0.16.2] - 2026-08-08

- Added VS Code's native find widget (Cmd/Ctrl+F) inside the editor panel

## [0.16.1] - 2026-08-08

- Fixed unnecessary backslashes appearing before headings, brackets, tildes, asterisks and backticks on save
- Fixed a `[label]: url`-shaped line disappearing on reload
- Changed italics to keep the marker (`_` or `*`) a file was already using instead of always rewriting it to `*` on save
- Added an `editorMarkdownNotes.italicMarker` setting for which marker new italics use

## [0.16.0] - 2026-08-08

- Added an `editor-markdown-notes.toggleHideToolbar` command
- Changed the `editorMarkdownNotes.hideNav` setting to `editorMarkdownNotes.hideToolbar`. Update this setting's name if you've customized it

## [0.15.0] - 2026-08-07

- Changed the frontmatter panel to a multi-line text area so multi-line values are usable

## [0.14.0] - 2026-08-07

- Added a writing tools sidebar that flags passive voice, weak words, words that could be simpler, and hard-to-read sentences against a configurable target reading age

## [0.13.1] - 2026-08-07

- Fixed bubble menu colors

## [0.13.0] - 2026-08-07

- Added a frontmatter panel for editing YAML frontmatter as raw text, fixing a leading `---` block being parsed and mangled as an `<hr>` on save

## [0.12.0] - 2026-08-07

- Added rendering for Mermaid diagrams in fenced ` ```mermaid ` code blocks

## [0.11.1] - 2026-08-07

- Fixed the nav bar rendering underneath the editor content

## [0.11.0] - 2026-08-07

- Added an Editor Markdown Notes: Show logs output channel that reports webview failures instead of only showing a blank panel

## [0.10.5] - 2026-08-07

- Fixed the panel loading blank in some cases
- Fixed a spurious CSP violation logged on every load

## [0.10.4] - 2026-08-07

- Fixed spacing on task list items

## [0.10.3] - 2026-08-07

- Changed the webview bundle to load faster with code-split, cacheable chunks

## [0.10.2] - 2026-08-07

- Added support for images referenced from markdown, resolving relative and root-absolute paths the same way VS Code's own markdown preview does

## [0.10.1] - 2026-08-07

- Fixed table cell content wrapping in an unwanted paragraph

## [0.10.0] - 2026-08-06

- Added support for markdown tables, task lists and images, previously rendered as plain text or silently dropped on the next auto-save

## [0.9.0] - 2026-08-06

- Added syncing of view options and VS Code settings across open editor tabs

## [0.8.0] - 2026-08-06

- Fixed malformed stored or received view options blanking the editor

## [0.7.1] - 2026-08-06

- Fixed a markdown file containing `</script>` loading blank

## [0.7.0] - 2026-08-06

- Added persisting the raw, full-width and theme toggles across editor tabs and sessions
- Added the `editorMarkdownNotes.centerContent` and `editorMarkdownNotes.hideNav` settings

## [0.6.0] - 2026-08-06

- Added messaging between the extension and the webview

## [0.5.0] - 2025-08-04

- Added support for installing the extension locally from a `.vsix` package

## [0.4.0] - 2025-08-04

- Added the first working custom editor, replacing the extension scaffold

## [0.3.0] - 2025-08-04

- Fixed the editor not matching VS Code's color theme

## [0.2.0] - 2025-08-04

- Fixed the bubble menu being sized wrong for its content

## [0.1.0] - 2025-08-04

- Added the initial project scaffold
