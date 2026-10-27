import { createFileRoute } from "@tanstack/react-router";
import { DocsPage, Prose } from "#/components/docs/docs-page";
import { docsHead, loadMethod } from "#/lib/docs";

export const Route = createFileRoute("/docs/reference/methods/$name")({
	loader: ({ params }) => loadMethod(params.name),
	head: ({ loaderData }) => docsHead(loaderData?.name ?? "Method", loaderData?.summary),
	component: MethodPage,
});

/** One protocol method, as the engine documents it. */
function MethodPage() {
	const m = Route.useLoaderData();
	return (
		<DocsPage
			kicker={`Protocol method · ${m.name.split(".")[0]}`}
			title={<span className="font-mono tracking-[-0.03em]">{m.name}</span>}
			toc={m.headings}
		>
			<Prose html={m.html} />
		</DocsPage>
	);
}
