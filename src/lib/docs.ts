import { notFound } from "@tanstack/react-router";
import index from "#/content/engine/index.json";
import type {
	CliPage,
	CommandPage,
	CsharpKind,
	CsharpType,
	DocsIndex,
	MarkdownPage,
	SchemaKind,
	TypePage,
} from "#/lib/docs-data";
import { shareMeta } from "#/lib/site";

/*
 * Loading the docs' content. The engine reference (src/content/engine, from
 * `pnpm sync-engine`) and the manual (src/content/manual/*.md) are split into one
 * chunk per page, so a page only downloads its own data; the index is small and
 * shared by listings, the sidebar and search.
 */

export const docsIndex = index as DocsIndex;

/** A manual page's frontmatter, plus its file name as `slug`. */
export type ManualMeta = { slug: string; title: string; description: string; section: ManualSection; order: number };
export type ManualPage = ManualMeta & Pick<MarkdownPage, "html" | "headings">;

/** The manual's sections, in reading order. */
export const MANUAL_SECTIONS = ["Start", "Concepts", "Scripting", "Agents"] as const;
export type ManualSection = (typeof MANUAL_SECTIONS)[number];

const manualMeta = import.meta.glob<ManualMeta>("/src/content/manual/*.md", { import: "meta", eager: true });
const manualPages = import.meta.glob<ManualPage>("/src/content/manual/*.md", { import: "default" });

/** Every manual page, grouped by section in reading order. */
export const manual = MANUAL_SECTIONS.map((section) => ({
	section,
	pages: Object.values(manualMeta)
		.filter((p) => p.section === section)
		.sort((a, b) => a.order - b.order),
})).filter((s) => s.pages.length > 0);

/** The manual in reading order, for previous/next links. */
export const manualOrder = manual.flatMap((s) => s.pages);

const engine = {
	types: import.meta.glob<TypePage>("/src/content/engine/types/*.json", { import: "default" }),
	commands: import.meta.glob<CommandPage>("/src/content/engine/commands/*.json", { import: "default" }),
	methods: import.meta.glob<MarkdownPage>("/src/content/engine/methods/*.json", { import: "default" }),
	errors: import.meta.glob<MarkdownPage>("/src/content/engine/errors/*.json", { import: "default" }),
	cli: import.meta.glob<CliPage>("/src/content/engine/cli/*.json", { import: "default" }),
	csharp: import.meta.glob<CsharpType>("/src/content/engine/csharp/*.json", { import: "default" }),
	pages: import.meta.glob<MarkdownPage>("/src/content/engine/pages/*.json", { import: "default" }),
};

/** Loads one page of the given kind, or throws the router's not-found. */
async function load<T>(pages: Record<string, () => Promise<T>>, path: string): Promise<T> {
	const page = pages[path];
	if (!page) throw notFound();
	return page();
}

export const loadManualPage = (slug: string) => load(manualPages, `/src/content/manual/${slug}.md`);
export const loadType = (name: string) => load(engine.types, `/src/content/engine/types/${name}.json`);
export const loadCommand = (name: string) => load(engine.commands, `/src/content/engine/commands/${name}.json`);
export const loadMethod = (name: string) => load(engine.methods, `/src/content/engine/methods/${name}.json`);
export const loadError = (code: string) => load(engine.errors, `/src/content/engine/errors/${code}.json`);
export const loadCli = (name: string) => load(engine.cli, `/src/content/engine/cli/${name}.json`);
export const loadCsharp = (slug: string) => load(engine.csharp, `/src/content/engine/csharp/${slug}.json`);
export const loadEnginePage = (name: string) => load(engine.pages, `/src/content/engine/pages/${name}.json`);

const DOCS_DESCRIPTION = "The Ara manual, the C# scripting API and the engine reference.";

/** A docs page's <head>: "Light · Ara docs", its description and the docs' link preview. */
export function docsHead(title: string, summary?: string) {
	const description = summary || DOCS_DESCRIPTION;
	return {
		meta: [
			{ title: `${title} · Ara docs` },
			{ name: "description", content: description },
			...shareMeta(`${title} · Ara docs`, description, "docs"),
		],
	};
}

/** How each schema kind is named in headings and lists. */
export const SCHEMA_KINDS: Record<SchemaKind, { label: string; plural: string }> = {
	component: { label: "Component", plural: "Components" },
	struct: { label: "Value type", plural: "Value types" },
	record: { label: "Record", plural: "Records" },
	enum: { label: "Enum", plural: "Enums" },
	params: { label: "Command params", plural: "Command params" },
};

/** How each C# kind is named, in the order the API index lists them. */
export const CSHARP_KINDS: Record<CsharpKind, string> = {
	class: "Classes",
	struct: "Structs",
	interface: "Interfaces",
	attribute: "Attributes",
	enum: "Enums",
	delegate: "Delegates",
};

/** Groups items by a key, keeping the keys in first-seen order (or `order`, when given). */
export function groupBy<T>(items: readonly T[], key: (item: T) => string, order?: readonly string[]) {
	const groups = new Map<string, T[]>(order?.map((k) => [k, []]));
	for (const item of items) {
		const k = key(item);
		groups.set(k, [...(groups.get(k) ?? []), item]);
	}
	return [...groups].filter(([, list]) => list.length > 0);
}
