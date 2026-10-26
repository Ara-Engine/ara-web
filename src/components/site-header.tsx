import { Link } from "@tanstack/react-router";
import { Download, Github, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { AraLogo } from "#/components/brand";
import { CommandMenu } from "#/components/command-menu";
import { FacetButton } from "#/components/facet-button";
import { Button } from "#/components/ui/button";
import { Kbd, KbdGroup } from "#/components/ui/kbd";
import { links, sections } from "#/lib/site";
import { cn } from "#/lib/utils";

/** True once the page has scrolled past `offset` pixels. */
function useScrolled(offset = 8) {
	const [scrolled, setScrolled] = useState(false);
	useEffect(() => {
		const update = () => setScrolled(window.scrollY > offset);
		update();
		window.addEventListener("scroll", update, { passive: true });
		return () => window.removeEventListener("scroll", update);
	}, [offset]);
	return scrolled;
}

/**
 * Sticky top bar styled as the editor's menu bar, with the command palette.
 * Transparent over the hero; takes the chrome surface once the page scrolls.
 */
export function SiteHeader() {
	const [paletteOpen, setPaletteOpen] = useState(false);
	const scrolled = useScrolled();

	return (
		<header
			className={cn(
				"sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
				scrolled ? "border-border bg-chrome/80 backdrop-blur-md" : "border-transparent bg-transparent",
			)}
		>
			<div className="mx-auto flex h-14 max-w-content items-center gap-6 px-5 md:px-8">
				<Link to="/" aria-label="Ara home" className="shrink-0">
					<AraLogo landing />
				</Link>
				<nav className="hidden items-center gap-1 text-[0.84375rem] md:flex">
					{sections
						.filter((s) => s.id !== "get-started")
						.map((s) => (
							<a
								key={s.id}
								href={`#${s.id}`}
								className="rounded-sm px-2.5 py-1 text-muted-foreground transition-colors hover:bg-hover-surface hover:text-foreground"
							>
								{s.label}
							</a>
						))}
				</nav>
				<div className="ml-auto flex items-center gap-2">
					<button
						type="button"
						onClick={() => setPaletteOpen(true)}
						className="hidden h-8 w-64 items-center whitespace-nowrap gap-2 rounded-md border border-separator-strong bg-muted px-2.5 text-[0.78125rem] text-muted-foreground transition-colors hover:border-muted-foreground/40 lg:flex"
					>
						<Search className="size-3.5" />
						<span className="flex-1 truncate text-left">Search or run a command…</span>
						<KbdGroup>
							<Kbd>Ctrl</Kbd>
							<Kbd>K</Kbd>
						</KbdGroup>
					</button>
					<Button
						variant="ghost"
						size="icon-sm"
						className="lg:hidden"
						aria-label="Search or run a command"
						onClick={() => setPaletteOpen(true)}
					>
						<Search />
					</Button>
					<Button asChild variant="ghost" size="icon-sm" aria-label="Ara on GitHub">
						<a href={links.repo} target="_blank" rel="noreferrer">
							<Github />
						</a>
					</Button>
					<FacetButton asChild size="sm">
						<a href={links.hubInstaller}>
							<Download />
							Download
						</a>
					</FacetButton>
				</div>
			</div>
			<CommandMenu open={paletteOpen} onOpenChange={setPaletteOpen} />
		</header>
	);
}
