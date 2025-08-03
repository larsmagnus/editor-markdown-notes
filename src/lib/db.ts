import fs from 'fs/promises'
import path from 'path'

import matter from 'gray-matter'

import { safeStat } from '@/lib/safe-stat'
import { toSlug, toTitle } from '@/lib/slug'

export interface ParsedPage {
  [key: string]: unknown // Generic key-value pairs for frontmatter
}

export type MarkdownFile<T extends Record<string, unknown>> = {
  frontmatter?: T
  body?: string
}

export interface DBOptions<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends MarkdownFile<T> {
  pathname?: string
  fileName?: string | number
  /**
   * How many levels deep to search for files
   * - undefined means no limit
   * - 0 means only the current folder
   * - >=1 means current folder and n levels deep
   */
  depth?: number
  /**
   * If true, will create any dir or file that's missing
   * when trying to get contents
   */
  createMissing?: boolean
  // If true, will not include index.md files
  ignoreIndex?: boolean
}

/**
 * Get the pathname of a folder or file in src/content/...args
 *
 * @example
 *
 * ```
 * path.join(process.cwd(), 'src', 'content', pathname)
 * ```
 */
export function getContentFolder(...args: string[]) {
  // Remove duplicate absolute segments
  const absoluteSegments = [process.cwd(), 'src', 'content']
  const absolutePath = path.join(...absoluteSegments)
  const segments = args.join('/').replaceAll(absolutePath, '').split('/')

  return path.join(...absoluteSegments, ...segments)
}

export async function getMarkdownPage(
  pathname: string,
  name: string
): Promise<ParsedPage | undefined> {
  const fileName = name.endsWith('.mdx') ? name : `${name}.mdx`
  const contentDir = getContentFolder(pathname)
  const entryPath = path.join(contentDir, fileName)

  const isFile = await safeStat(entryPath, (stats) => stats.isFile())

  if (!isFile) {
    console.warn(
      `File "${fileName}" does not exist in "${pathname}" with path: "${entryPath}"`
    )

    return
  }

  // Parse the file with gray-matter
  const fileContent = await fs.readFile(entryPath, 'utf-8')
  const file = toSlug(name)
  const title = toTitle(name)

  const { data: frontmatter, content: body } = matter(fileContent)

  return { ...frontmatter, content: body, file, title, category: pathname }
}

export async function getMarkdownPages(
  options?: DBOptions
): Promise<ParsedPage[]> {
  const {
    pathname = '',
    depth, // Default to no traversal limit
    fileName,
    ignoreIndex = true,
    createMissing,
  } = options || {}

  console.log('get md pages', options)

  const pages: ParsedPage[] = []

  // Read all files and subdirectories in the given folder
  const contentDir = getContentFolder(pathname)
  const isDirectory = await safeStat(contentDir, (stats) => stats.isDirectory())

  if (createMissing && !isDirectory) {
    await fs.mkdir(contentDir, { recursive: true })
    console.log(`Created missing folder "${contentDir}"`)
  } else if (!isDirectory) {
    throw new Error(`Folder "${contentDir}" does not exist`)
  }

  const entries = await fs.readdir(contentDir, { withFileTypes: true })

  for (const entry of entries) {
    const entryPath = path.join(pathname, entry.name)

    if (
      entry.isDirectory() &&
      fileName == undefined &&
      (depth === undefined || depth > 0)
    ) {
      // Recursively collect pages from subdirectories, decrementing depth if set
      const subPages = await getMarkdownPages({
        pathname: entryPath,
        depth: depth === undefined ? undefined : depth - 1,
        fileName,
        createMissing,
      })
      pages.push(...subPages)
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.mdx') &&
      !(ignoreIndex && entry.name === 'index.mdx') &&
      // continue if searching dirs
      // or if searching for a file, and the name matches
      (fileName == undefined ||
        (fileName !== undefined && entry.name.startsWith(`${fileName}`)))
    ) {
      const page = await getMarkdownPage(pathname, entry.name)

      // Add the parsed frontmatter to the result
      if (page) {
        pages.push(page)
      }
    }
  }

  return pages
}

export async function getPages<T extends ParsedPage[]>(options: DBOptions) {
  return (await getMarkdownPages(options)) as T
}

export async function getPage<T extends ParsedPage>(options: DBOptions) {
  const pages = await getPages<T[]>(options)
  return pages[0]
}
