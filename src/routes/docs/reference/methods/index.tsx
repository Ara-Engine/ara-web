import { createFileRoute } from "@tanstack/react-router";
import { DocsPage, SectionHeading } from "#/components/docs/docs-page";
import { Listing } from "#/components/docs/reference";
import { docsHead, docsIndex, groupBy } from "#/lib/docs";

export const Route = createFileRoute("/docs/reference/methods/")({
	component: MethodsIndex,
	head: () => docsHead("Protocol methods", "The Engine Protocol methods, which are also the MCP tools."),
});

/** Every Engine Protocol method, grouped by service prefix (`session.begin` → session). */
function MethodsIndex() {
	const groups = groupBy(docsIndex.methods, (m) => m.name.split(".")[0]);
	return (
		<DocsPage
			kicker={`Reference · Protocol ${docsIndex.protocol}`}
			title="Protocol methods"
			lead="The Engine Protocol is what the editor, the CLI and agents speak to a project's daemon; the MCP tools are built on it. Most calls take a session handle from session.begin."
			toc={groups.map(([g]) => ({ id: g, text: g, depth: 2 }))}
		>
			{groups.map(([group, list]) => (
				<section key={group}>
					<SectionHeading id={group}>
						<span className="font-mono">{group}</span>
					</SectionHeading>
					<Listing
						items={list.map((m) => ({ href: `/docs/reference/methods/${m.name}`, name: m.name, summary: m.summary }))}
					/>
				</section>
			))}
		</DocsPage>
	);
}
