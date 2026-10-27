import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsPage, SectionHeading } from "#/components/docs/docs-page";
import { Listing } from "#/components/docs/reference";
import { docsHead, docsIndex, groupBy, SCHEMA_KINDS } from "#/lib/docs";

export const Route = createFileRoute("/docs/reference/types/")({
	component: TypesIndex,
	head: () => docsHead("Types", "Value types, document records, enums and command params of the Ara schema."),
});

const ORDER = ["struct", "record", "enum", "params"] as const;

/** Every schema type that isn't a component, by kind; then the document kinds that hold records. */
function TypesIndex() {
	const groups = groupBy(
		docsIndex.types.filter((t) => t.kind !== "component"),
		(t) => t.kind,
		ORDER,
	);
	return (
		<DocsPage
			kicker="Reference · Types"
			title="Types"
			lead={
				<>
					The schema's value types, records, enums and command params. Components have{" "}
					<Link
						to="/docs/reference/components"
						className="text-foreground underline decoration-white/30 underline-offset-4"
					>
						their own listing
					</Link>
					.
				</>
			}
			toc={[
				...groups.map(([k]) => ({ id: k, text: SCHEMA_KINDS[k as (typeof ORDER)[number]].plural, depth: 2 as const })),
				{ id: "documents", text: "Document kinds", depth: 2 },
			]}
		>
			{groups.map(([kind, list]) => (
				<section key={kind}>
					<SectionHeading id={kind}>{SCHEMA_KINDS[kind as (typeof ORDER)[number]].plural}</SectionHeading>
					<Listing
						items={list.map((t) => ({ href: `/docs/reference/types/${t.name}`, name: t.name, summary: t.summary }))}
					/>
				</section>
			))}
			<section>
				<SectionHeading id="documents">Document kinds</SectionHeading>
				<div className="border-t border-white/12">
					{docsIndex.documents.map((d) => (
						<div
							key={d.name}
							className="grid gap-x-8 gap-y-2 border-b border-white/8 py-4 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]"
						>
							<div>
								<p className="font-mono text-[0.9375rem]">.{d.extension}</p>
								<p className="mt-1 font-mono text-[0.75rem] text-muted-foreground">ID prefix {d.idPrefix}_</p>
							</div>
							<div>
								<p className="text-[0.9375rem] text-foreground/80">{d.summary}</p>
								<div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
									{d.records.map((r) => (
										<Link
											key={r}
											to="/docs/reference/types/$name"
											params={{ name: r }}
											className="font-mono text-[0.8125rem] text-muted-foreground hover:text-foreground"
										>
											{r}
										</Link>
									))}
								</div>
							</div>
						</div>
					))}
				</div>
			</section>
		</DocsPage>
	);
}
