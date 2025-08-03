import type { PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'

const markdownFiles = import.meta.glob<{ default: string }>('@/content/*.md', {
  query: 'raw',
})

console.log('Got markdown files', markdownFiles)
const rootPath = '/src/content/'

function useContent({
  defaultFileName = 'notes.md',
}: PropsWithChildren<{ defaultFileName?: string }>) {
  const [files, setFiles] = useState<
    { value: string; label: string; content: string }[]
  >([])
  const [fileName, setFileName] = useState(defaultFileName)
  const [content, setContent] = useState('')

  useEffect(() => {
    async function getAllFiles() {
      const rawFiles = await Promise.all(
        Object.entries(markdownFiles).map(async ([path, promise]) => {
          const fileContent = await promise()
          return {
            value: path.replaceAll(rootPath, ''),
            label: path.replaceAll(rootPath, ''),
            content: fileContent.default,
          }
        })
      )

      setFiles(rawFiles)
    }

    getAllFiles()
  }, [defaultFileName])

  useEffect(() => {
    async function getContent() {
      const path = `/src/content/${fileName}`

      console.log('getting content')

      if (markdownFiles[path]) {
        const fileContent = await markdownFiles[path]()
        const content = fileContent.default ?? ''

        setContent(content)
      } else {
        setContent(`File "${fileName}" not found`)
      }
    }
    getContent()
  }, [fileName])

  return { fileName, setFileName, content, files }
}

export default useContent
