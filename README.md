# ara-web

The home page and documentation for [Ara](https://github.com/Ara-Engine/ara), an AI-native game engine in Rust.

Built with TanStack Start, React and Tailwind CSS v4, prerendered to static HTML. The theme is the editor's own: tokens come from the engine's `assets/themes/ara-dark.json`, and the fonts (Inter, JetBrains Mono) match the editor's.

## Develop

```sh
pnpm install
pnpm dev          # http://localhost:3000
pnpm typecheck
pnpm check        # Biome lint + format check
pnpm build        # static output, every page prerendered
```

## Docs

`/docs` has three parts:

- **Manual** (`/docs/manual/*`): hand-written Markdown in `src/content/manual/`. Frontmatter sets `title`, `description`, `section` (`Start`, `Concepts`, `Scripting` or `Agents`) and `order`; the sidebar and previous/next follow it. Callouts are blockquotes starting `> **Note:**`, `> **Warning:**` or `> **Gap:**`.
- **Scripting API** (`/docs/scripting/*`): the public C# API of `Ara.Runtime`.
- **Engine reference** (`/docs/reference/*`): components, types, commands, protocol methods, diagnostic codes and the CLI.

The scripting API and the reference are generated from the engine, never written by hand. After each engine release, with it installed (and the .NET SDK for the C# part):

```sh
pnpm sync-engine          # newest engine under %LOCALAPPDATA%\Ara\Engines
ARA_EXE=…\ara.exe pnpm sync-engine
```

It runs the engine's own exports in a clean `ara init` project (`ara schema`, `ara docs --llms`, every `ara <command> --help`), reads `Ara.Runtime.dll` and its XML docs with `tools/csharp-api`, and writes one JSON file per page into `src/content/engine/`, with Markdown and code already rendered to HTML. Commit the result; the site builds without the engine.

## Layout

```
src/routes/            pages (file-based routing); docs/ is the documentation
src/components/home/   home page sections; mashrabiya.tsx/.frag is the hero's live WebGL light,
                       editor-demo.tsx the agent-turn demo in the editor
src/components/docs/   the docs' sidebar, page frame and reference blocks
src/components/ui/     shadcn components, restyled to the editor's tokens
src/content/manual/    the manual (Markdown)
src/content/engine/    the generated reference (pnpm sync-engine; don't edit)
src/lib/site.ts        release links and the source file behind every published number
src/lib/docs*.ts       docs data: types, loaders, search
scripts/               sync-engine.ts and the build-time Markdown renderer (Shiki)
tools/csharp-api/      dumps Ara.Runtime's C# API to JSON
design/                logo and hero explorations; icons/ (app icons) and og/ (the link-preview
                       cards in public/og/: node design/og/og.mjs) are generators
```

Every number on the home page links to the engine file it was measured in (`evidence` in `src/lib/site.ts`). Update those with each engine release.
