import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsPage, SectionHeading } from "#/components/docs/docs-page";
import { Listing } from "#/components/docs/reference";
import { CSHARP_KINDS, docsHead, docsIndex, groupBy } from "#/lib/docs";

export const Route = createFileRoute("/docs/scripting/")({
	component: ScriptingIndex,
	head: () =>
		docsHead("Scripting API", "The C# API of Ara.Runtime: behaviours, the world, entities, attributes and commands."),
});

/** The C# API by kind: every public type of Ara.Runtime. */
function ScriptingIndex() {
	const groups = groupBy(docsIndex.csharp, (t) => t.kind, Object.keys(CSHARP_KINDS));
	return (
		<DocsPage
			kicker="Scripting API · Ara.Runtime"
			title="C# scripting API"
			lead={
				<>
					Gameplay is plain C# 14 on .NET 10, hosted inside the engine. These are the public types of{" "}
					<code>Ara.Runtime</code>, with signatures and docs read from the shipped assembly. New to scripting? Start
					with the{" "}
					<Link
						to="/docs/manual/$slug"
						params={{ slug: "scripting-overview" }}
						className="text-foreground underline decoration-white/30 underline-offset-4"
					>
						scripting overview
					</Link>
					.
				</>
			}
			toc={groups.map(([kind]) => ({ id: kind, text: CSHARP_KINDS[kind as keyof typeof CSHARP_KINDS], depth: 2 }))}
		>
			{groups.map(([kind, types]) => (
				<section key={kind}>
					<SectionHeading id={kind}>{CSHARP_KINDS[kind as keyof typeof CSHARP_KINDS]}</SectionHeading>
					<Listing
						items={types.map((t) => ({ href: `/docs/scripting/${t.slug}`, name: t.name, summary: t.summary }))}
					/>
				</section>
			))}
		</DocsPage>
	);
}
