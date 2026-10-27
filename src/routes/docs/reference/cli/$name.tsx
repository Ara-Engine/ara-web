import { createFileRoute } from "@tanstack/react-router";
import { DocsPage, SectionHeading, type TocEntry } from "#/components/docs/docs-page";
import { Code, Html } from "#/components/docs/reference";
import { docsHead, loadCli } from "#/lib/docs";

export const Route = createFileRoute("/docs/reference/cli/$name")({
	loader: ({ params }) => loadCli(params.name),
	head: ({ loaderData }) =>
		docsHead(loaderData ? `ara ${loaderData.name}` : "CLI", loaderData?.summary.replace(/<[^>]+>/g, "")),
	component: CliPageView,
});

/** One `ara` subcommand, from its own `--help`. */
function CliPageView() {
	const c = Route.useLoaderData();
	const toc: TocEntry[] = [
		{ id: "usage", text: "Usage", depth: 2 },
		...(c.args.length ? [{ id: "arguments", text: "Arguments", depth: 2 as const }] : []),
		{ id: "options", text: "Options", depth: 2 },
	];
	return (
		<DocsPage
			kicker="CLI"
			title={<span className="font-mono tracking-[-0.03em]">ara {c.name}</span>}
			lead={<Html html={c.summary} />}
			toc={toc}
		>
			<SectionHeading id="usage">Usage</SectionHeading>
			<Code html={c.usage} />
			{c.args.length > 0 && <Entries id="arguments" title="Arguments" entries={c.args} />}
			<Entries id="options" title="Options" entries={c.options} />
		</DocsPage>
	);
}

function Entries({ id, title, entries }: { id: string; title: string; entries: { name: string; doc: string }[] }) {
	return (
		<section>
			<SectionHeading id={id}>{title}</SectionHeading>
			<div className="border-t border-white/12">
				{entries.map((e) => (
					<div
						key={e.name}
						className="grid gap-x-8 gap-y-1 border-b border-white/8 py-4 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]"
					>
						<code className="font-mono text-[0.875rem] [overflow-wrap:anywhere]">{e.name}</code>
						<Html html={e.doc} className="prose-inline text-[0.9375rem] leading-relaxed text-foreground/80" />
					</div>
				))}
			</div>
		</section>
	);
}
