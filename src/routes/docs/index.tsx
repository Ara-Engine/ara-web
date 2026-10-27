import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AraCrystal, Nuqta } from "#/components/brand";
import { docsHead, docsIndex, manual, manualOrder } from "#/lib/docs";

export const Route = createFileRoute("/docs/")({
	component: DocsHome,
	head: () => docsHead("Documentation", "The Ara manual, the C# scripting API and the engine reference."),
});

const components = docsIndex.types.filter((t) => t.kind === "component").length;

/** The three ways into the docs, each lighting one facet of the mark. */
const DOORS = [
	{
		to: manualOrder[0] ? `/docs/manual/${manualOrder[0].slug}` : "/docs",
		title: "Manual",
		body: "Install Ara, make a project, and learn how documents, commands, review and agents fit together.",
		count: `${manualOrder.length} pages`,
	},
	{
		to: "/docs/scripting",
		title: "Scripting API",
		body: "Behaviours, the world, entities, attributes and commands: the C# you write gameplay in.",
		count: `${docsIndex.csharp.length} types`,
	},
	{
		to: "/docs/reference/components",
		title: "Engine reference",
		body: "Every component, field, command, protocol method and diagnostic code, generated from the engine itself.",
		count: `${components} components · ${docsIndex.commands.length} commands`,
	},
] as const;

/** Where newcomers usually start. */
const START = ["install", "first-project", "connect-an-agent", "scripting-overview", "commands-and-transactions"];

function DocsHome() {
	const starts = START.map((slug) => manualOrder.find((p) => p.slug === slug)).filter((p) => p !== undefined);

	return (
		<div className="pb-24">
			<header className="max-w-[48rem] border-b border-white/10 pb-12">
				<p className="flex items-center gap-2.5 font-mono text-[0.6875rem] tracking-[0.18em] text-muted-foreground uppercase">
					<Nuqta />
					Ara {docsIndex.version} · Documentation
				</p>
				<h1 className="mt-6 text-[3rem] leading-[0.96] font-semibold tracking-[-0.045em] text-balance md:text-[4.5rem]">
					Build with Ara. <span className="text-foreground/35">Every field, documented.</span>
				</h1>
				<p className="mt-6 max-w-[38rem] text-[1.0625rem] leading-relaxed text-foreground/65">
					The manual is written by hand. The reference comes from the engine: every type, field, unit, range and command
					below is exported by <code className="font-mono text-foreground">ara</code> itself, so it matches the version
					you run.
				</p>
			</header>

			<div className="mt-12 grid gap-px border border-white/10 bg-white/10 lg:grid-cols-3">
				{DOORS.map((d, i) => (
					<Link
						key={d.title}
						to={d.to}
						className="group relative flex flex-col bg-background p-7 transition-colors hover:bg-white/[0.03]"
					>
						<span
							aria-hidden
							className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-white shadow-[0_0_10px_rgb(255_255_255/0.7)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
						/>
						<AraCrystal lit={i} className="size-9" />
						<h2 className="mt-8 text-[1.5rem] font-semibold tracking-[-0.03em]">{d.title}</h2>
						<p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">{d.body}</p>
						<p className="mt-8 flex items-center justify-between font-mono text-[0.71875rem] text-foreground/60">
							{d.count}
							<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
						</p>
					</Link>
				))}
			</div>

			<div className="mt-20 grid gap-14 lg:grid-cols-2">
				<section>
					<h2 className="font-mono text-[0.6875rem] tracking-[0.18em] text-muted-foreground uppercase">Start here</h2>
					<ol className="mt-5 border-t border-white/12">
						{starts.map((p, i) => (
							<li key={p.slug} className="border-b border-white/8">
								<Link
									to="/docs/manual/$slug"
									params={{ slug: p.slug }}
									className="group flex items-baseline gap-5 py-4"
								>
									<span className="font-mono text-[0.75rem] text-foreground/40">{String(i + 1).padStart(2, "0")}</span>
									<span>
										<span className="block text-[1.0625rem] font-medium group-hover:text-white">{p.title}</span>
										<span className="mt-0.5 block text-[0.875rem] text-muted-foreground">{p.description}</span>
									</span>
								</Link>
							</li>
						))}
					</ol>
				</section>
				<section>
					<h2 className="font-mono text-[0.6875rem] tracking-[0.18em] text-muted-foreground uppercase">The manual</h2>
					<div className="mt-5 space-y-6 border-t border-white/12 pt-5">
						{manual.map(({ section, pages }) => (
							<div key={section}>
								<p className="text-[0.8125rem] font-medium text-foreground/45">{section}</p>
								<div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
									{pages.map((p) => (
										<Link
											key={p.slug}
											to="/docs/manual/$slug"
											params={{ slug: p.slug }}
											className="text-[0.9375rem] text-foreground/85 hover:text-white"
										>
											{p.title}
										</Link>
									))}
								</div>
							</div>
						))}
					</div>
				</section>
			</div>

			<section className="mt-20">
				<h2 className="font-mono text-[0.6875rem] tracking-[0.18em] text-muted-foreground uppercase">
					Generated from ara {docsIndex.version} · protocol {docsIndex.protocol}
				</h2>
				<div className="mt-5 grid grid-cols-2 border-t border-white/12 sm:grid-cols-3 lg:grid-cols-6">
					{[
						["Components", components, "/docs/reference/components"],
						["Types", docsIndex.types.length - components, "/docs/reference/types"],
						["Commands", docsIndex.commands.length, "/docs/reference/commands"],
						["Protocol methods", docsIndex.methods.length, "/docs/reference/methods"],
						["Diagnostic codes", docsIndex.errors.length, "/docs/reference/errors"],
						["C# types", docsIndex.csharp.length, "/docs/scripting"],
					].map(([label, n, to]) => (
						<Link key={label} to={String(to)} className="group border-b border-white/8 py-5 pr-4">
							<span className="block text-[2.5rem] leading-none font-extralight tracking-[-0.05em] tabular-nums group-hover:text-white">
								{n}
							</span>
							<span className="mt-2 block text-[0.8125rem] text-muted-foreground">{label}</span>
						</Link>
					))}
				</div>
			</section>
		</div>
	);
}
