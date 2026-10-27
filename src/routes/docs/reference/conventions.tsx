import { createFileRoute } from "@tanstack/react-router";
import { DocsPage, Prose } from "#/components/docs/docs-page";
import { docsHead, loadEnginePage } from "#/lib/docs";

export const Route = createFileRoute("/docs/reference/conventions")({
	loader: () => loadEnginePage("conventions"),
	head: () => docsHead("Conventions", "Axes, units, IDs, references and the rules every Ara edit follows."),
	component: ConventionsPage,
});

/** The engine's conventions, as `ara docs` writes them. */
function ConventionsPage() {
	const page = Route.useLoaderData();
	return (
		<DocsPage kicker="Reference" title={page.title} toc={page.headings}>
			<Prose html={page.html} />
		</DocsPage>
	);
}
