import { createFileRoute } from "@tanstack/react-router";
import { DocsPage, SectionHeading } from "#/components/docs/docs-page";
import { Listing } from "#/components/docs/reference";
import { docsHead, docsIndex, groupBy } from "#/lib/docs";

export const Route = createFileRoute("/docs/reference/components")({
	component: ComponentsIndex,
	head: () => docsHead("Components", "Every engine component, grouped by module."),
});

const components = docsIndex.types.filter((t) => t.kind === "component");

/** Every engine component, grouped by the module that owns it. */
function ComponentsIndex() {
	const modules = groupBy(components, (c) => c.module ?? "other").sort(([a], [b]) => a.localeCompare(b));
	return (
		<DocsPage
			kicker="Reference · Components"
			title="Components"
			lead={`The ${components.length} components entities are made of, by engine module. Each page lists every field with its type, unit, range and default.`}
			toc={modules.map(([m]) => ({ id: m, text: m, depth: 2 }))}
		>
			{modules.map(([module, list]) => (
				<section key={module}>
					<SectionHeading id={module}>
						<span className="font-mono">{module}</span>
					</SectionHeading>
					<Listing
						items={list.map((c) => ({ href: `/docs/reference/types/${c.name}`, name: c.name, summary: c.summary }))}
					/>
				</section>
			))}
		</DocsPage>
	);
}
