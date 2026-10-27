import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { type MouseEvent, type ReactNode, useEffect, useState } from "react";
import { Nuqta } from "#/components/brand";
import { cn } from "#/lib/utils";

export type TocEntry = { id: string; text: string; depth: 2 | 3 };

type DocsPageProps = {
	/** The mono line above the title: where the page sits ("Component · render"). */
	kicker: ReactNode;
	title: ReactNode;
	lead?: ReactNode;
	/** The page's outline, shown beside it on wide screens. */
	toc?: TocEntry[];
	prev?: { href: string; title: string };
	next?: { href: string; title: string };
	children: ReactNode;
};

/** A docs page: kicker, title and lead, the content, previous/next, and its outline. */
export function DocsPage({ kicker, title, lead, toc = [], prev, next, children }: DocsPageProps) {
	return (
		<div className="flex gap-12 xl:gap-16">
			{/* A section right under the header needs no space above its heading. */}
			<article className="min-w-0 flex-1 pb-24 [&>header+section>h2]:mt-0">
				<header className="mb-10 border-b border-white/10 pb-8">
					<p className="flex items-center gap-2.5 font-mono text-[0.6875rem] tracking-[0.18em] text-muted-foreground uppercase">
						<Nuqta />
						{kicker}
					</p>
					<h1 className="mt-5 text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.04em] text-balance [overflow-wrap:anywhere] md:text-[3rem]">
						{title}
					</h1>
					{lead && (
						<div className="mt-5 max-w-[44rem] text-[1.0625rem] leading-relaxed text-pretty text-foreground/65 [&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-foreground">
							{lead}
						</div>
					)}
				</header>
				{children}
				{(prev || next) && (
					<nav className="mt-20 grid gap-3 border-t border-white/10 pt-8 sm:grid-cols-2">
						{prev ? <PageLink {...prev} dir="prev" /> : <span />}
						{next && <PageLink {...next} dir="next" />}
					</nav>
				)}
			</article>
			{toc.length > 1 && <Outline toc={toc} />}
		</div>
	);
}

function PageLink({ href, title, dir }: { href: string; title: string; dir: "prev" | "next" }) {
	return (
		<Link
			to={href}
			className={cn(
				"group flex flex-col gap-1 border border-white/10 px-5 py-4 transition-colors hover:border-white/30",
				dir === "next" && "sm:text-right",
			)}
		>
			<span
				className={cn(
					"flex items-center gap-1.5 font-mono text-[0.6875rem] tracking-[0.16em] text-muted-foreground uppercase",
					dir === "next" && "sm:justify-end",
				)}
			>
				{dir === "prev" && <ArrowLeft className="size-3" />}
				{dir === "prev" ? "Previous" : "Next"}
				{dir === "next" && <ArrowRight className="size-3" />}
			</span>
			<span className="text-[1rem] font-medium">{title}</span>
		</Link>
	);
}

/** "On this page": the headings, with the one being read lit. */
function Outline({ toc }: { toc: TocEntry[] }) {
	const active = useActiveHeading(toc);
	return (
		<aside className="sticky top-24 hidden max-h-[calc(100svh-8rem)] w-52 shrink-0 self-start overflow-y-auto xl:block">
			<p className="mb-4 font-mono text-[0.6875rem] tracking-[0.18em] text-muted-foreground uppercase">On this page</p>
			<ul className="space-y-1 border-l border-white/10 text-[0.8125rem]">
				{toc.map((h) => (
					<li key={h.id}>
						<a
							href={`#${h.id}`}
							className={cn(
								"-ml-px block border-l py-1 transition-colors",
								h.depth === 3 ? "pl-6" : "pl-3",
								active === h.id
									? "border-white text-foreground"
									: "border-transparent text-muted-foreground hover:text-foreground",
							)}
						>
							{h.text}
						</a>
					</li>
				))}
			</ul>
		</aside>
	);
}

/** The id of the last heading scrolled past the top of the viewport. */
function useActiveHeading(toc: TocEntry[]) {
	const [active, setActive] = useState(toc[0]?.id);
	useEffect(() => {
		const update = () => {
			let current = toc[0]?.id;
			for (const h of toc) {
				const el = document.getElementById(h.id);
				if (el && el.getBoundingClientRect().top < 120) current = h.id;
			}
			setActive(current);
		};
		update();
		window.addEventListener("scroll", update, { passive: true });
		return () => window.removeEventListener("scroll", update);
	}, [toc]);
	return active;
}

/**
 * A click handler for a block of pre-rendered HTML: its links to other docs pages
 * navigate in place instead of reloading the site.
 */
export function useInternalLinks() {
	const router = useRouter();
	return (e: MouseEvent<HTMLElement>) => {
		const a = (e.target as HTMLElement).closest("a");
		const href = a?.getAttribute("href");
		if (!a || !href?.startsWith("/") || a.target || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
		e.preventDefault();
		const [to, hash] = href.split("#");
		router.navigate({ to, hash });
	};
}

/** Pre-rendered HTML (Markdown, the engine's docs), styled by `.prose-docs`. */
export function Prose({ html, className }: { html: string; className?: string }) {
	const onClick = useInternalLinks();
	// biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions lint/security/noDangerouslySetInnerHtml: build-time HTML; delegates clicks on its links
	return <div className={cn("prose-docs", className)} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** A heading inside a generated page, matching the prose's h2 and linked from the outline. */
export function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
	return (
		<h2 id={id} className="mt-16 mb-6 scroll-mt-24 text-[1.5rem] font-semibold tracking-[-0.03em]">
			{children}
		</h2>
	);
}
