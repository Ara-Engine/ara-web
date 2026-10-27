import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsPage, SectionHeading, type TocEntry } from "#/components/docs/docs-page";
import { Badge, Code, FieldTable, Html } from "#/components/docs/reference";
import { docsHead, loadCommand } from "#/lib/docs";

export const Route = createFileRoute("/docs/reference/commands/$name")({
	loader: ({ params }) => loadCommand(params.name),
	head: ({ loaderData }) => docsHead(loaderData?.name ?? "Command", loaderData?.summary.replace(/<[^>]+>/g, "")),
	component: CommandPageView,
});

/** One command: what it needs (scope, params) and examples as JSON and from the CLI. */
function CommandPageView() {
	const c = Route.useLoaderData();
	const toc: TocEntry[] = [
		{ id: "params", text: "Params", depth: 2 },
		...(c.examples.length ? [{ id: "examples", text: "Examples", depth: 2 as const }] : []),
	];

	return (
		<DocsPage
			kicker={`Command · ${c.name.split(".")[0]}`}
			title={<span className="font-mono tracking-[-0.03em]">{c.name}</span>}
			lead={<Html html={c.summary} />}
			toc={toc}
		>
			<div className="flex flex-wrap items-center gap-2">
				<Badge tone="lit">scope {c.scope}</Badge>
				<Badge>{c.idempotent ? "idempotent" : "not idempotent"}</Badge>
				<Badge tone={c.destructive ? "warn" : "plain"}>{c.destructive ? "destructive" : "non-destructive"}</Badge>
			</div>

			<section>
				<SectionHeading id="params">Params</SectionHeading>
				{c.params && (
					<p className="mb-5 text-[0.875rem] text-muted-foreground">
						Typed as{" "}
						<Link
							to="/docs/reference/types/$name"
							params={{ name: c.params }}
							className="font-mono text-foreground/85 hover:text-foreground"
						>
							{c.params}
						</Link>
						. Fields marked <span className="text-warning-foreground">*</span> are required.
					</p>
				)}
				<FieldTable fields={c.fields} />
			</section>

			{c.examples.length > 0 && (
				<section>
					<SectionHeading id="examples">Examples</SectionHeading>
					<div className="space-y-10">
						{c.examples.map((e) => (
							<div key={e.json} className="space-y-3">
								<Code label="JSON (MCP ara_apply, batches)" html={e.json} />
								<Code label="CLI" html={e.cli} />
							</div>
						))}
					</div>
				</section>
			)}
		</DocsPage>
	);
}
