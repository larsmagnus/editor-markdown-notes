import { Eye, EyeClosed, Maximize2, Minimize2 } from 'lucide-react'
import { type PropsWithChildren, useState } from 'react'

import { Combobox } from '@/components/combobox'
import { ThemeProvider } from '@/components/theme-provider'
import ThemeToggle from '@/components/theme-toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import Editor from '@/editor/editor'
import useContent from '@/hooks/use-content'
import { cn } from '@/lib/utils'

function App({
  defaultFileName = 'notes.md',
}: PropsWithChildren<{ defaultFileName?: string }>) {
  const { content, files, fileName, setFileName } = useContent({
    defaultFileName,
  })
  const [showNav, setShowNav] = useState(true)
  const [options, setOptions] = useState<string[] | null>(null)
  const maxWidth = options?.includes('max-w-full') ? 'max-w-full' : ''
  const isRaw = options?.includes('raw')

  return (
    <ThemeProvider>
      <div className="h-full">
        {showNav && (
          <nav className="sticky top-0 left-0 bg-background/20 backdrop-blur-md p-3 flex gap-2 items-center">
            <Combobox values={files} value={fileName} setValue={setFileName} />
            <ToggleGroup
              type="multiple"
              onValueChange={(values) => setOptions(values)}
            >
              <ToggleGroupItem value="raw">
                {options?.includes('raw') ? <EyeClosed /> : <Eye />}
              </ToggleGroupItem>
              <ToggleGroupItem value="max-w-full">
                {options?.includes('max-w-full') ? (
                  <Maximize2 />
                ) : (
                  <Minimize2 />
                )}
              </ToggleGroupItem>
              <ToggleGroupItem value="theme" asChild>
                <ThemeToggle />
              </ToggleGroupItem>
            </ToggleGroup>
          </nav>
        )}

        <main className="grid p-3 min-h-screen">
          {isRaw ? (
            <pre className={cn('h-full', maxWidth)} contentEditable>
              {content}
            </pre>
          ) : (
            <Editor
              content={content}
              includeProseBaseClassNames
              className={cn('h-full', maxWidth)}
            />
          )}
        </main>
      </div>
    </ThemeProvider>
  )
}

export default App
