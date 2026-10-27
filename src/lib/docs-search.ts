import { docsIndex, manualOrder, SCHEMA_KINDS } from "#/lib/docs";

/** One searchable docs page: what the palette shows, and words it should match on. */
export type SearchItem = { label: string; hint: string; href: string; keywords: string[] };

const components = docsIndex.types.filter((t) => t.kind === "component");
const otherTypes = docsIndex.types.filter((t) => t.kind !== "component");

/**
 * Every docs page for the command palette, grouped as the sidebar is. Loaded on demand
 * (the palette imports this module the first time it opens).
 */
export const searchGroups: { heading: string; items: SearchItem[] }[] = [
	{
		heading: "Manual",
		items: manualOrder.map((p) => ({
			label: p.title,
			hint: p.section,
			href: `/docs/manual/${p.slug}`,
			keywords: [p.description],
		})),
	},
	{
		heading: "Scripting API",
		items: docsIndex.csharp.map((t) => ({
			label: t.name,
			hint: `C# ${t.kind}`,
			href: `/docs/scripting/${t.slug}`,
			keywords: [t.summary],
		})),
	},
	{
		heading: "Components",
		items: components.map((t) => ({
			label: t.name,
			hint: t.module ?? "component",
			href: `/docs/reference/types/${t.name}`,
			keywords: [t.summary],
		})),
	},
	{
		heading: "Types",
		items: otherTypes.map((t) => ({
			label: t.name,
			hint: SCHEMA_KINDS[t.kind].label,
			href: `/docs/reference/types/${t.name}`,
			keywords: [t.summary],
		})),
	},
	{
		heading: "Commands",
		items: docsIndex.commands.map((c) => ({
			label: c.name,
			hint: "command",
			href: `/docs/reference/commands/${c.name}`,
			keywords: [c.summary],
		})),
	},
	{
		heading: "Protocol methods",
		items: docsIndex.methods.map((m) => ({
			label: m.name,
			hint: "method",
			href: `/docs/reference/methods/${m.name}`,
			keywords: [m.summary],
		})),
	},
	{
		heading: "Diagnostic codes",
		items: docsIndex.errors.map((e) => ({
			label: `${e.code} ${e.title}`,
			hint: "code",
			href: `/docs/reference/errors/${e.code}`,
			keywords: [],
		})),
	},
	{
		heading: "CLI",
		items: docsIndex.cli.map((c) => ({
			label: `ara ${c.name}`,
			hint: "CLI",
			href: `/docs/reference/cli/${c.name}`,
			keywords: [c.summary],
		})),
	},
];
