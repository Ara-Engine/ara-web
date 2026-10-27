import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CSHARP_KINDS, docsIndex, groupBy, manual } from "#/lib/docs";
import { cn } from "#/lib/utils";

/** The engine reference's listings, in sidebar order. */
const REFERENCE = [
	{ to: "/docs/reference/components", label: "Components", match: "/docs/reference/components" },
	{ to: "/docs/reference/types", label: "Types", match: "/docs/reference/types" },
	{ to: "/docs/reference/commands", label: "Commands", match: "/docs/reference/commands" },
	{ to: "/docs/reference/methods", label: "Protocol methods", match: "/docs/reference/methods" },
	{ to: "/docs/reference/errors", label: "Diagnostic codes", match: "/docs/reference/errors" },
	{ to: "/docs/reference/cli", label: "CLI", match: "/docs/reference/cli" },
	{ to: "/docs/reference/conventions", label: "Conventions", match: "/docs/reference/conventions" },
	{ to: "/docs/reference/scopes", label: "Session scopes", match: "/docs/reference/scopes" },
] as const;

/**
 * The docs' navigation: the manual by section, the C# API by kind, and the engine
 * reference's listings. The current page is lit like the site's active tab.
 */
export function DocsSidebar() {
	const path = useRouterState({ select: (s) => s.location.pathname.replace(/\/$/, "") });

	return (
		<nav aria-label="Documentation" className="space-y-9 text-[0.875rem]">
			<Group title="Manual">
				{manual.map(({ section, pages }) => (
					<div key={section} className="mt-4 first:mt-0">
						<p className="mb-1.5 pl-3 text-[0.75rem] font-medium text-foreground/45">{section}</p>
						{pages.map((p) => (
							<Item key={p.slug} href={`/docs/manual/${p.slug}`} active={path === `/docs/manual/${p.slug}`}>
								{p.title}
							</Item>
						))}
					</div>
				))}
			</Group>

			<Group title="Scripting API">
				<Item href="/docs/scripting" active={path === "/docs/scripting"}>
					Overview
				</Item>
				{groupBy(docsIndex.csharp, (t) => t.kind, Object.keys(CSHARP_KINDS)).map(([kind, types]) => (
					<details key={kind} open={types.some((t) => path === `/docs/scripting/${t.slug}`)} className="group/kind">
						<summary className="flex cursor-pointer list-none items-center justify-between rounded-sm py-1 pr-2 pl-3 text-muted-foreground transition-colors hover:text-foreground">
							{CSHARP_KINDS[kind as keyof typeof CSHARP_KINDS]}
							<span className="font-mono text-[0.6875rem] text-foreground/35">{types.length}</span>
						</summary>
						<div className="ml-3 border-l border-white/8 pl-1">
							{types.map((t) => (
								<Item
									key={t.slug}
									href={`/docs/scripting/${t.slug}`}
									active={path === `/docs/scripting/${t.slug}`}
									mono
								>
									{t.name}
								</Item>
							))}
						</div>
					</details>
				))}
			</Group>

			<Group title="Reference">
				{REFERENCE.map((r) => (
					<Item key={r.to} href={r.to} active={path === r.match || path.startsWith(`${r.match}/`)}>
						{r.label}
					</Item>
				))}
			</Group>
		</nav>
	);
}

function Group({ title, children }: { title: string; children: ReactNode }) {
	return (
		<div>
			<p className="mb-3 pl-3 font-mono text-[0.6875rem] tracking-[0.18em] text-muted-foreground uppercase">{title}</p>
			{children}
		</div>
	);
}

/** One link; the active one is white with a lit edge on its left. */
function Item({
	href,
	active,
	mono,
	children,
}: {
	href: string;
	active: boolean;
	mono?: boolean;
	children: ReactNode;
}) {
	return (
		<Link
			to={href}
			className={cn(
				"relative block truncate rounded-sm py-1 pr-2 pl-3 transition-colors",
				mono && "font-mono text-[0.78125rem]",
				active
					? "bg-white/[0.05] text-foreground before:absolute before:inset-y-1 before:left-0 before:w-px before:bg-white before:shadow-[0_0_8px_rgb(255_255_255/0.8)]"
					: "text-muted-foreground hover:text-foreground",
			)}
		>
			{children}
		</Link>
	);
}
