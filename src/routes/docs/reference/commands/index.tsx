import { createFileRoute } from "@tanstack/react-router";
import { DocsPage, SectionHeading } from "#/components/docs/docs-page";
import { Listing } from "#/components/docs/reference";
import { docsHead, docsIndex, groupBy } from "#/lib/docs";

export const Route = createFileRoute("/docs/reference/commands/")({
	component: CommandsIndex,
	head: () => docsHead("Commands", "Every typed, undoable edit command, grouped by what it edits."),
});

/** Every command, grouped by its namespace (`entity.create` → entity). */
function CommandsIndex() {
	const groups = groupBy(docsIndex.commands, (c) => c.name.split(".")[0]);
	return (
		<DocsPage
			kicker="Reference · Commands"
			title="Commands"
			lead="Every edit is a typed command, applied as an undoable transaction with an author and a reason: ara do from the CLI, ara_apply over MCP, the same JSON either way."
			toc={groups.map(([g]) => ({ id: g, text: g, depth: 2 }))}
		>
			{groups.map(([group, list]) => (
				<section key={group}>
					<SectionHeading id={group}>
						<span className="font-mono">{group}</span>
					</SectionHeading>
					<Listing
						items={list.map((c) => ({ href: `/docs/reference/commands/${c.name}`, name: c.name, summary: c.summary }))}
					/>
				</section>
			))}
		</DocsPage>
	);
}
