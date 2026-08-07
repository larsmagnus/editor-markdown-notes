# other-note.md

The image near the bottom uses a root-absolute path. That root is the workspace
folder in the extension and the site root in the web app, so the icon is kept in
both places.

# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

---

**Bold text**

_Italic text_

_**Bold and italic text**_

~~Strikethrough~~

`Inline code`

> Blockquote
>
> > Nested blockquote

---

- Unordered list item 1
- Unordered list item 2
  - Nested unordered item

1. Ordered list item 1
2. Ordered list item 2
   1. Nested ordered item

- [x] Completed task
- [ ] Incomplete task

Horizontal break 👇

---

Code block

```js
// Code block with "js" language
function helloWorld() {
	console.log('Hello, world!')
}
```

Table

| Feature   | Status      | Notes                                     |
| --------- | ----------- | ----------------------------------------- |
| Tables    | **Shipped** | Cells keep `inline code` and marks        |
| Task list | **Shipped** | Checkboxes round-trip their checked state |
| Footnotes | Missing     | See [the docs](https://example.com)       |

Table with column alignment (the alignment is dropped on load - see CLAUDE.md)

| Left | Centered | Right |
| ---- | -------- | ----- |
| a    | b        | c     |
| dd   | ee       | ff    |

Image

![Editor Markdown Notes icon](/icon-editor-markdown-notes.png)

An inline [link to example.com](https://example.com), and a bare autolink: <https://example.com>
