import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsPage, SectionHeading, type TocEntry } from "#/components/docs/docs-page";
import { Badge, Code, FieldTable, Html, LinkChips } from "#/components/docs/reference";
import { docsHead, docsIndex, loadType, SCHEMA_KINDS } from "#/lib/docs";

export const Route = createFileRoute("/docs/reference/types/$name")({
	loader: ({ params }) => loadType(params.name),
	head: ({ loaderData }) => docsHead(loaderData?.name ?? "Type", loaderData?.doc.replace(/<[^>]+>/g, "")),
	component: TypePageView,
});

/** Components scripts can reach today: the C# runtime's engine-component structs. */
const SCRIPTABLE = docsIndex.csharp.filter(
	(t) => t.kind === "struct" && docsIndex.types.some((s) => s.name === t.slug && s.kind === "component"),
);

/** One schema type: its fields (or variants), how to use it, and what refers to it. */
function TypePageView() {
	const t = Route.useLoaderData();
	const kind = SCHEMA_KINDS[t.kind];
	const isComponent = t.kind === "component";
	const usedBy = [
		...t.usedBy.types.map((n) => ({ href: `/docs/reference/types/${n}`, label: n })),
		...t.usedBy.commands.map((n) => ({ href: `/docs/reference/commands/${n}`, label: n })),
	];
	const toc: TocEntry[] = [
		...(t.fields.length ? [{ id: "fields", text: "Fields", depth: 2 as const }] : []),
		...(t.variants.length ? [{ id: "variants", text: "Variants", depth: 2 as const }] : []),
		...(t.usage ? [{ id: "usage", text: "Usage", depth: 2 as const }] : []),
		...(isComponent ? [{ id: "csharp", text: "From C#", depth: 2 as const }] : []),
		...(usedBy.length ? [{ id: "used-by", text: "Used by", depth: 2 as const }] : []),
	];

	return (
		<DocsPage
			kicker={`${kind.label}${t.module ? ` · ${t.module}` : ""}`}
			title={<span className="font-mono tracking-[-0.03em]">{t.name}</span>}
			lead={<Html html={t.doc} />}
			toc={toc}
		>
			{t.prefix && (
				<p className="mb-8 flex items-center gap-2 text-[0.875rem] text-muted-foreground">
					Record IDs start with <Badge tone="lit">{t.prefix}_</Badge>
				</p>
			)}

			{t.fields.length > 0 && (
				<section>
					<SectionHeading id="fields">Fields</SectionHeading>
					<FieldTable fields={t.fields} />
				</section>
			)}

			{t.variants.length > 0 && (
				<section>
					<SectionHeading id="variants">Variants</SectionHeading>
					<div className="border-t border-white/12">
						{t.variants.map((v) => (
							<div
								key={v.name}
								className="grid gap-x-8 gap-y-1 border-b border-white/8 py-4 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]"
							>
								<code className="font-mono text-[0.9375rem]">"{v.name}"</code>
								<Html html={v.doc} className="prose-inline text-[0.9375rem] text-foreground/80" />
							</div>
						))}
					</div>
				</section>
			)}

			{t.usage && (
				<section>
					<SectionHeading id="usage">Usage</SectionHeading>
					<p className="mb-6 max-w-[44rem] text-[0.9375rem] leading-relaxed text-muted-foreground">
						Every edit is an undoable command: from the CLI as below, or the same JSON from an agent over MCP. See{" "}
						<Link
							to="/docs/reference/commands/$name"
							params={{ name: "component.add" }}
							className="text-foreground underline decoration-white/30 underline-offset-4"
						>
							component.add
						</Link>{" "}
						and{" "}
						<Link
							to="/docs/reference/commands/$name"
							params={{ name: "property.set" }}
							className="text-foreground underline decoration-white/30 underline-offset-4"
						>
							property.set
						</Link>
						.
					</p>
					<div className="space-y-5">
						{t.usage.map((u) => (
							<Code key={u.label} label={u.label} html={u.html} />
						))}
					</div>
				</section>
			)}

			{isComponent && (
				<section>
					<SectionHeading id="csharp">From C#</SectionHeading>
					{t.csharp ? (
						<p className="text-[0.9375rem] leading-relaxed text-foreground/80">
							Scripts read and write it with <code className="font-mono">Get&lt;{t.name}&gt;()</code>; see the{" "}
							<Link
								to="/docs/scripting/$slug"
								params={{ slug: t.csharp }}
								className="text-foreground underline decoration-white/30 underline-offset-4"
							>
								{t.name} struct
							</Link>
							.
						</p>
					) : (
						<aside className="callout" data-kind="gap">
							<p>
								<strong>Gap</strong> Scripts can't reach this component yet: in {docsIndex.version} the C# runtime binds
								only{" "}
								{SCRIPTABLE.map((s, i) => (
									<span key={s.slug}>
										{i > 0 && ", "}
										<Link to="/docs/scripting/$slug" params={{ slug: s.slug }}>
											{s.name}
										</Link>
									</span>
								))}
								. Edit it with commands, in the editor or by an agent.
							</p>
						</aside>
					)}
				</section>
			)}

			{usedBy.length > 0 && (
				<section>
					<SectionHeading id="used-by">Used by</SectionHeading>
					<LinkChips items={usedBy} />
				</section>
			)}
		</DocsPage>
	);
}
