import { createFileRoute } from "@tanstack/react-router";
import { DocsPage, Prose } from "#/components/docs/docs-page";
import { docsHead, loadEnginePage } from "#/lib/docs";

export const Route = createFileRoute("/docs/reference/scopes")({
	loader: () => loadEnginePage("scopes"),
	head: () => docsHead("Session scopes", "The capabilities an Engine Protocol session can hold."),
	component: ScopesPage,
});

/** The session scopes, as `ara docs` writes them. */
function ScopesPage() {
	const page = Route.useLoaderData();
	return (
		<DocsPage kicker="Reference" title={page.title} toc={page.headings}>
			<Prose html={page.html} />
		</DocsPage>
	);
}
