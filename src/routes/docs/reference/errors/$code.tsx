import { createFileRoute } from "@tanstack/react-router";
import { DocsPage, Prose } from "#/components/docs/docs-page";
import { docsHead, loadError } from "#/lib/docs";

export const Route = createFileRoute("/docs/reference/errors/$code")({
	loader: ({ params }) => loadError(params.code),
	head: ({ loaderData }) =>
		docsHead(loaderData ? `${loaderData.name} ${loaderData.title}` : "Diagnostic code", loaderData?.summary),
	component: ErrorPage,
});

/** One diagnostic code: what it means, common causes and fixes, as the engine documents it. */
function ErrorPage() {
	const e = Route.useLoaderData();
	return (
		<DocsPage kicker={`Diagnostic code · ${e.name}`} title={e.title} toc={e.headings}>
			<Prose html={e.html} />
		</DocsPage>
	);
}
