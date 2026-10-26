# ara-web

The home page (and, next, the documentation) for [Ara](https://github.com/Ara-Engine/ara), an AI-native game engine in Rust.

Built with TanStack Start, React, Tailwind CSS v4 and shadcn/ui, prerendered to static HTML. The theme is the editor's own: tokens come from the engine's `assets/themes/ara-dark.json`, and the fonts (Inter, JetBrains Mono) match the editor's.

## Develop

```sh
pnpm install
pnpm dev          # http://localhost:3000
pnpm typecheck
pnpm check        # Biome lint + format check
pnpm build        # static output, every page prerendered
```

## Layout

```
src/routes/            pages (file-based routing)
src/components/home/   home page sections; editor-demo.tsx is the hero's live editor
src/components/ui/     shadcn components, restyled to the editor's tokens
src/lib/site.ts        release links and the source file behind every published number
design/                logo and hero explorations (not shipped)
```

Every number on the site links to the engine file it was measured in (`evidence` in `src/lib/site.ts`). Update those with each engine release.
