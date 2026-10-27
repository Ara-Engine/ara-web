import { createFileRoute } from "@tanstack/react-router";
import { DocsPage, Prose } from "#/components/docs/docs-page";
import { docsHead, loadManualPage, manualOrder } from "#/lib/docs";

export const Route = createFileRoute("/docs/manual/$slug")({
	loader: ({ params }) => loadManualPage(params.slug),
	head: ({ loaderData }) => docsHead(loaderData?.title ?? "Manual", loaderData?.description),
	component: ManualPage,
});

/** A hand-written manual page (src/content/manual/<slug>.md), with previous/next in reading order. */
function ManualPage() {
	const page = Route.useLoaderData();
	const at = manualOrder.findIndex((p) => p.slug === page.slug);
	const link = (i: number) => {
		const p = manualOrder[i];
		return p ? { href: `/docs/manual/${p.slug}`, title: p.title } : undefined;
	};

	return (
		<DocsPage
			kicker={`Manual · ${page.section}`}
			title={page.title}
			lead={page.description}
			toc={page.headings}
			prev={link(at - 1)}
			next={link(at + 1)}
		>
			<Prose html={page.html} />
		</DocsPage>
	);
}
