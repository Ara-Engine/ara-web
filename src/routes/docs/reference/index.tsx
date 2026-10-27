import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsPage } from "#/components/docs/docs-page";
import { docsHead, docsIndex } from "#/lib/docs";

export const Route = createFileRoute("/docs/reference/")({
	component: ReferenceIndex,
	head: () =>
		docsHead(
			"Engine reference",
			"Generated from the engine: components, types, commands, protocol methods, diagnostic codes and the CLI.",
		),
});

const components = docsIndex.types.filter((t) => t.kind === "component").length;

const PARTS = [
	{
		to: "/docs/reference/components",
		title: "Components",
		count: components,
		body: "What entities are made of, field by field: units, ranges, defaults and options.",
	},
	{
		to: "/docs/reference/types",
		title: "Types",
		count: docsIndex.types.length - components,
		body: "Value types, document records, enums and command params.",
	},
	{
		to: "/docs/reference/commands",
		title: "Commands",
		count: docsIndex.commands.length,
		body: "Every edit as a typed, undoable command, from the CLI, MCP or C#.",
	},
	{
		to: "/docs/reference/methods",
		title: "Protocol methods",
		count: docsIndex.methods.length,
		body: "The Engine Protocol the editor, CLI and agents speak; also the MCP tools.",
	},
	{
		to: "/docs/reference/errors",
		title: "Diagnostic codes",
		count: docsIndex.errors.length,
		body: "Every stable code with its causes and fixes, as ara why explains them.",
	},
	{
		to: "/docs/reference/cli",
		title: "CLI",
		count: docsIndex.cli.length,
		body: "The ara command line: every subcommand, argument and option.",
	},
] as const;

/** The reference's front page: what each part holds. */
function ReferenceIndex() {
	return (
		<DocsPage
			kicker={`Reference · ara ${docsIndex.version}`}
			title="Engine reference"
			lead="Generated from the engine with every release: the schema, commands and diagnostics are exported by ara itself, so nothing here is copied by hand."
		>
			<div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-3">
				{PARTS.map((p) => (
					<Link key={p.to} to={p.to} className="group bg-background p-6 transition-colors hover:bg-white/[0.03]">
						<p className="text-[2.75rem] leading-none font-extralight tracking-[-0.05em] tabular-nums">{p.count}</p>
						<h2 className="mt-4 text-[1.25rem] font-semibold tracking-[-0.02em] group-hover:text-white">{p.title}</h2>
						<p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted-foreground">{p.body}</p>
					</Link>
				))}
			</div>
		</DocsPage>
	);
}
