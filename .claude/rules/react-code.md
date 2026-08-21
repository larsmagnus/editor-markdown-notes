---
paths:
  - '**/*.tsx,**/*.ts'
---

# React Code Rules

- Import and use named React types when needed. Never rely on React globals like `React.ReactNode`
- Use shadcn components for UI.
- Define component props with an explicit interface or type alias, and use that for the function parameter. NEVER define inline object types like `function MyComponent({ prop1, prop2 }: { prop1: string; prop2: number }) { ... }`
- Define event handlers instead of inline functions in JSX, to avoid unnecessary re-renders and improve readability,
- Define React components with `function` syntax, to get better type inference and stack traces. ONLY WHEN RELEVANT use arrow functions
- Add a TSDoc block above every component and hook briefly explaining what it does. Use block style for functions, single-line style for types.
- Use React components for any non-trivial rendering logic - never plain render functions (functions returning ReactNode). Components can be memoised, profiled, and tested independently.
- Use semantically correct HTML for structure. Hierarchical lists must use nested ul/li elements, not flat lists with spacing or padding hacks. Tables must use table/thead/tbody/tr/th/td, not divs with grid classes.
- When reusing shared computation, prefer the narrowest applicable primitive over a large orchestrator. Orchestrators do more work than needed and couple the component to unrelated derivations.
- Never edit files in `src/components/ui/` unless explicitly instructed. These are shadcn primitives that are regenerated and can overwrite any custom changes. Apply customisations at the consumer level via `className`, or create a module-local wrapper component that composes the underlying primitive directly.
