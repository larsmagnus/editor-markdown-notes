/** The heading levels the schema and both menus support, in display order. */
export const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const

export type HeadingLevel = (typeof HEADING_LEVELS)[number]
