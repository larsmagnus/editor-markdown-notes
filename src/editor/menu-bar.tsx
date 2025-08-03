import { Button } from '@/components/ui/button'
import { ButtonHeading } from '@/editor/button-heading'
import { ButtonStyle } from '@/editor/button-style'
import { useEditorTools } from '@/hooks/use-editor-tools'

export function MenuBar() {
  const { editor, undo, canUndo, redo, canRedo } = useEditorTools()

  if (!editor) {
    return null
  }

  return (
    <div className="flex gap-1">
      <ButtonStyle style="bold" className="font-bold" />
      <ButtonStyle style="italic" className="italic" />
      <ButtonStyle style="strike" className="line-through" />
      <ButtonStyle style="code" />
      <ButtonStyle style="paragraph" />

      <Button
        type="button"
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
      >
        Clear marks
      </Button>
      <Button
        type="button"
        onClick={() => editor.chain().focus().clearNodes().run()}
      >
        Clear nodes
      </Button>

      <ButtonHeading level={1} />
      <ButtonHeading level={2} />
      <ButtonHeading level={3} />
      <ButtonHeading level={4} />
      <ButtonHeading level={5} />
      <ButtonHeading level={6} />

      <ButtonStyle style="unordered">Bullet list</ButtonStyle>
      <ButtonStyle style="ordered">Ordered list</ButtonStyle>
      <ButtonStyle style="codeBlock">Code block</ButtonStyle>
      <ButtonStyle style="blockquote">Blockquote</ButtonStyle>

      <Button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        Horizontal rule
      </Button>
      <Button
        type="button"
        onClick={() => editor.chain().focus().setHardBreak().run()}
      >
        Hard break
      </Button>

      <Button type="button" onClick={() => undo()} disabled={!canUndo()}>
        Undo
      </Button>
      <Button type="button" onClick={() => redo()} disabled={!canRedo()}>
        Redo
      </Button>
    </div>
  )
}
