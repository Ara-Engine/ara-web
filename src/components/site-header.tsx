import { Link } from "@tanstack/react-router";
import { Download, Github, Search } from "lucide-react";
import { useState } from "react";
import { AraLogo } from "#/components/brand";
import { CommandMenu } from "#/components/command-menu";
import { Button } from "#/components/ui/button";
import { Kbd, KbdGroup } from "#/components/ui/kbd";
import { links, sections } from "#/lib/site";

/** Sticky top bar styled as the editor's menu bar, with the command palette. */
export function SiteHeader() {
	const [paletteOpen, setPaletteOpen] = useState(false);

	return (
		<header className="sticky top-0 z-40 border-b bg-chrome/80 backdrop-blur-md">
			<div className="mx-auto flex h-14 max-w-[1200px] items-center gap-6 px-5 md:px-8">
				<Link to="/" aria-label="Ara home" className="shrink-0">
					<AraLogo />
				</Link>
				<nav className="hidden items-center gap-1 text-[13.5px] md:flex">
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
						className="hidden h-8 w-64 items-center whitespace-nowrap gap-2 rounded-md border border-separator-strong bg-muted px-2.5 text-[12.5px] text-muted-foreground transition-colors hover:border-muted-foreground/40 lg:flex"
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
					<Button asChild size="sm">
						<a href={links.hubInstaller}>
							<Download />
							Download
						</a>
					</Button>
				</div>
			</div>
			<CommandMenu open={paletteOpen} onOpenChange={setPaletteOpen} />
		</header>
	);
}
