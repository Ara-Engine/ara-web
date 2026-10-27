import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useInternalLinks } from "#/components/docs/docs-page";
import type { FieldDoc } from "#/lib/docs-data";
import { cn } from "#/lib/utils";

/*
 * Building blocks for the generated reference pages: field tables, code, badges and
 * listings, all reading pre-rendered HTML from the engine snapshot.
 */

/** Inline pre-rendered HTML (a doc line, a linked type). */
export function Html({ html, className }: { html: string; className?: string }) {
	// biome-ignore lint/security/noDangerouslySetInnerHtml: rendered at sync time from the engine's own docs
	return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** A highlighted code block (Shiki HTML from the sync). */
export function Code({ html, label, className }: { html: string; label?: string; className?: string }) {
	return (
		<div className={cn("code-block", className)} data-label={label}>
			{label && <p className="code-label">{label}</p>}
			<Html html={html} />
		</div>
	);
}

export function Badge({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "lit" | "warn" }) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 border px-1.5 py-px font-mono text-[0.6875rem] whitespace-nowrap",
				tone === "lit" && "border-white/40 text-foreground",
				tone === "warn" && "border-warning-foreground/40 text-warning-foreground",
				tone === "plain" && "border-white/12 text-muted-foreground",
			)}
		>
			{children}
		</span>
	);
}

/**
 * A type's fields or a command's params: name and type on the left; the description
 * and every constraint the schema knows (default, unit, range, options) on the right.
 */
export function FieldTable({ fields }: { fields: FieldDoc[] }) {
	const onClick = useInternalLinks();
	if (fields.length === 0) return <p className="text-muted-foreground">No fields.</p>;
	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: delegates clicks on the type links inside
		<div onClick={onClick} className="border-t border-white/12">
			{fields.map((f) => (
				<div
					key={f.name}
					id={`field-${f.name}`}
					className="grid scroll-mt-24 gap-x-8 gap-y-2 border-b border-white/8 py-5 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]"
				>
					<div className="min-w-0">
						<p className="font-mono text-[0.9375rem] font-medium [overflow-wrap:anywhere]">
							{f.name}
							{f.required && <span className="ml-1.5 text-warning-foreground">*</span>}
						</p>
						<Html
							html={f.typeHtml}
							className="mt-1 block font-mono text-[0.78125rem] text-muted-foreground [overflow-wrap:anywhere] [&_a]:text-foreground/85 [&_a]:underline [&_a]:decoration-white/25 [&_a]:underline-offset-2 hover:[&_a]:decoration-white"
						/>
					</div>
					<div className="min-w-0">
						<Html html={f.doc} className="prose-inline text-[0.9375rem] leading-relaxed text-foreground/80" />
						<FieldFacts field={f} />
					</div>
				</div>
			))}
		</div>
	);
}

function FieldFacts({ field: f }: { field: FieldDoc }) {
	const facts: ReactNode[] = [];
	if (f.required)
		facts.push(
			<Badge key="req" tone="warn">
				required
			</Badge>,
		);
	if (f.default !== undefined) facts.push(<Badge key="def">default {f.default}</Badge>);
	if (f.unit)
		facts.push(
			<Badge key="unit" tone="lit">
				{f.unit}
			</Badge>,
		);
	if (f.range) facts.push(<Badge key="range">{f.range}</Badge>);
	if (f.replicate) facts.push(<Badge key="rep">replicated · {f.replicate}</Badge>);
	if (f.showIf) facts.push(<Badge key="if">shown when {f.showIf}</Badge>);
	return (
		<>
			{facts.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{facts}</div>}
			{f.options && (
				<p className="mt-3 flex flex-wrap items-center gap-1.5 text-[0.78125rem] text-muted-foreground">
					One of
					{f.options.map((o) => (
						<code key={o} className="border border-white/12 bg-white/[0.04] px-1.5 py-px font-mono text-foreground/85">
							{o}
						</code>
					))}
				</p>
			)}
		</>
	);
}

/** A listing of reference pages: name and one-line summary, in two columns on wide screens. */
export function Listing({ items }: { items: { href: string; name: string; summary: string }[] }) {
	return (
		<ul className="grid border-t border-white/12 md:grid-cols-2 md:gap-x-10">
			{items.map((item) => (
				<li key={item.href} className="border-b border-white/8">
					<Link to={item.href} className="group block py-3.5">
						<span className="font-mono text-[0.875rem] text-foreground transition-colors group-hover:text-white">
							{item.name}
						</span>
						<span className="mt-1 block text-[0.84375rem] leading-snug text-muted-foreground line-clamp-2">
							{item.summary}
						</span>
					</Link>
				</li>
			))}
		</ul>
	);
}

/** A row of links to related pages (who uses a type, which commands touch it). */
export function LinkChips({ items }: { items: { href: string; label: string }[] }) {
	return (
		<div className="flex flex-wrap gap-2">
			{items.map((i) => (
				<Link
					key={i.href}
					to={i.href}
					className="border border-white/12 px-2.5 py-1 font-mono text-[0.78125rem] text-foreground/85 transition-colors hover:border-white/40 hover:text-foreground"
				>
					{i.label}
				</Link>
			))}
		</div>
	);
}
