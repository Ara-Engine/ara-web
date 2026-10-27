import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsPage, Prose, SectionHeading, type TocEntry } from "#/components/docs/docs-page";
import { Code } from "#/components/docs/reference";
import { docsHead, groupBy, loadCsharp } from "#/lib/docs";
import type { CsharpMember } from "#/lib/docs-data";

export const Route = createFileRoute("/docs/scripting/$slug")({
	loader: ({ params }) => loadCsharp(params.slug),
	head: ({ loaderData }) =>
		docsHead(loaderData?.name ?? "Scripting API", loaderData?.summary?.replace(/<[^>]+>/g, "").trim()),
	component: CsharpTypePage,
});

/** Member sections, in the order a type page lists them. */
const SECTIONS: Record<CsharpMember["kind"], string> = {
	constructor: "Constructors",
	property: "Properties",
	field: "Fields",
	event: "Events",
	method: "Methods",
	operator: "Operators",
};

const KIND_LABEL = {
	class: "Class",
	struct: "Struct",
	interface: "Interface",
	enum: "Enum",
	attribute: "Attribute",
	delegate: "Delegate",
};

/** A member's anchor; matches the `#member` links the API dump writes for `<see cref>`. */
const anchor = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** One C# type: declaration, docs, then its members grouped by kind (overloads together). */
function CsharpTypePage() {
	const t = Route.useLoaderData();
	const sections = groupBy(t.members, (m) => m.kind, Object.keys(SECTIONS));
	const toc: TocEntry[] = [
		...(t.values.length ? [{ id: "values", text: "Values", depth: 2 as const }] : []),
		...sections.flatMap(([kind, members]) => [
			{ id: kind, text: SECTIONS[kind as CsharpMember["kind"]], depth: 2 as const },
			...groupBy(members, (m) => m.name).map(([name]) => ({ id: anchor(name), text: name, depth: 3 as const })),
		]),
	];

	return (
		<DocsPage
			kicker={`${KIND_LABEL[t.kind]} · ${t.namespace}`}
			title={<span className="font-mono tracking-[-0.03em]">{t.name}</span>}
			lead={t.summary && <Prose html={t.summary} className="prose-lead" />}
			toc={toc}
		>
			<Code html={t.declaration} />
			{t.component && (
				<aside className="callout mt-6" data-kind="note">
					<p>
						<strong>Note</strong> This struct is the engine's{" "}
						<Link to="/docs/reference/types/$name" params={{ name: t.component }}>
							{t.component}
						</Link>{" "}
						component; its fields, units and defaults are documented there.
					</p>
				</aside>
			)}
			{t.remarks && <Prose html={t.remarks} className="mt-8" />}
			{t.example && <Prose html={t.example} className="mt-8" />}
			{t.typeParams.length > 0 && <ParamList title="Type parameters" items={t.typeParams} />}

			{t.values.length > 0 && (
				<section>
					<SectionHeading id="values">Values</SectionHeading>
					<div className="border-t border-white/12">
						{t.values.map((v) => (
							<div
								key={v.name}
								className="grid gap-x-8 gap-y-1 border-b border-white/8 py-4 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]"
							>
								<p className="font-mono text-[0.9375rem]">
									{v.name} <span className="text-muted-foreground">= {v.value}</span>
								</p>
								{v.summary ? <Prose html={v.summary} className="prose-compact" /> : <span />}
							</div>
						))}
					</div>
				</section>
			)}

			{sections.map(([kind, members]) => (
				<section key={kind}>
					<SectionHeading id={kind}>{SECTIONS[kind as CsharpMember["kind"]]}</SectionHeading>
					<div className="space-y-12">
						{groupBy(members, (m) => m.name).map(([name, overloads]) => (
							<div key={name} id={anchor(name)} className="scroll-mt-24">
								<h3 className="mb-4 font-mono text-[1.125rem] font-medium">{name}</h3>
								<div className="space-y-8">
									{overloads.map((m) => (
										<Member key={m.signature} member={m} />
									))}
								</div>
							</div>
						))}
					</div>
				</section>
			))}
		</DocsPage>
	);
}

function Member({ member: m }: { member: CsharpMember }) {
	return (
		<div>
			<Code html={m.signature} />
			{m.summary ? (
				<Prose html={m.summary} className="mt-4" />
			) : (
				<p className="mt-4 text-[0.9375rem] text-muted-foreground">No description yet.</p>
			)}
			{m.typeParams.length > 0 && <ParamList title="Type parameters" items={m.typeParams} />}
			{m.params.some((p) => p.summary) && <ParamList title="Parameters" items={m.params} />}
			{m.returns && <ParamList title="Returns" items={[{ name: "", summary: m.returns }]} />}
			{m.value && <ParamList title="Value" items={[{ name: "", summary: m.value }]} />}
			{m.remarks && <Prose html={m.remarks} className="mt-4" />}
			{m.example && <Prose html={m.example} className="mt-4" />}
		</div>
	);
}

function ParamList({ title, items }: { title: string; items: { name: string; summary?: string }[] }) {
	return (
		<div className="mt-5">
			<p className="mb-2 font-mono text-[0.6875rem] tracking-[0.16em] text-muted-foreground uppercase">{title}</p>
			<dl className="space-y-2">
				{items.map((p) => (
					<div key={p.name || title} className="flex flex-wrap items-baseline gap-x-3">
						{p.name && <dt className="font-mono text-[0.875rem]">{p.name}</dt>}
						<dd className="min-w-0 flex-1">{p.summary && <Prose html={p.summary} className="prose-compact" />}</dd>
					</div>
				))}
			</dl>
		</div>
	);
}
