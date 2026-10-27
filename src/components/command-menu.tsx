import { useRouter } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
	ArrowUpRight,
	BookOpen,
	BookText,
	Download,
	FileText,
	Github,
	Hash,
	ListChecks,
	Milestone,
	TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandShortcut,
} from "#/components/ui/command";
import type { searchGroups as SearchGroups } from "#/lib/docs-search";
import { links, sections } from "#/lib/site";

type LinkCommand = { label: string; href: string; icon: LucideIcon };

const GET_ARA: LinkCommand[] = [
	{
		label: "Download Ara Hub for Windows",
		href: links.hubInstaller,
		icon: Download,
	},
	{ label: "Release notes", href: links.releaseNotes, icon: FileText },
	{ label: "All releases", href: links.releases, icon: ListChecks },
];

const ENGINE: LinkCommand[] = [
	{ label: "GitHub repository", href: links.repo, icon: Github },
	{ label: "Known issues", href: links.knownIssues, icon: TriangleAlert },
	{ label: "Decisions", href: links.decisions, icon: BookOpen },
	{ label: "Milestones", href: links.milestones, icon: Milestone },
];

/**
 * The site's command palette, like the editor's "Search or run a command…": site
 * sections and links, and, once you type, every docs page (loaded the first time the
 * palette opens). Ctrl/⌘+K toggles it; `open` is owned by the header so its button can
 * open it too.
 */
export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [docs, setDocs] = useState<typeof SearchGroups>();
	useEffect(() => {
		if (open && !docs) import("#/lib/docs-search").then((m) => setDocs(m.searchGroups));
	}, [open, docs]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				onOpenChange(!open);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onOpenChange]);

	const run = (action: () => void) => {
		onOpenChange(false);
		action();
	};

	// On the home page, scroll to the section; elsewhere (the docs), go to it.
	const goTo = (id: string) => {
		const section = document.getElementById(id);
		if (!section) return window.location.assign(`/#${id}`);
		section.scrollIntoView();
		history.replaceState(null, "", `#${id}`);
	};

	const openLink = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

	return (
		<CommandDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Search or run a command"
			description="Jump to a section or open an Ara link."
			showCloseButton={false}
			className="top-[22%] translate-y-0 sm:max-w-[35rem]"
		>
			<CommandInput placeholder="Search the docs or run a command…" value={query} onValueChange={setQuery} />
			<CommandList className="max-h-[22.5rem]">
				<CommandEmpty>Nothing matches.</CommandEmpty>
				<CommandGroup heading="Go to">
					{sections.map((s) => (
						<CommandItem key={s.id} value={`go to ${s.label}`} onSelect={() => run(() => goTo(s.id))}>
							<Hash />
							{s.label}
						</CommandItem>
					))}
					<CommandItem value="go to documentation docs" onSelect={() => run(() => router.navigate({ to: "/docs" }))}>
						<BookText />
						Documentation
					</CommandItem>
				</CommandGroup>
				{[
					{ heading: "Get Ara", items: GET_ARA },
					{ heading: "Engine", items: ENGINE },
				].map((group) => (
					<CommandGroup key={group.heading} heading={group.heading}>
						{group.items.map(({ label, href, icon: Icon }) => (
							<CommandItem key={label} value={label} onSelect={() => run(() => openLink(href))}>
								<Icon />
								{label}
								<CommandShortcut>
									<ArrowUpRight className="size-3.5" />
								</CommandShortcut>
							</CommandItem>
						))}
					</CommandGroup>
				))}
				{query.trim().length > 1 &&
					docs?.map((group) => (
						<CommandGroup key={group.heading} heading={group.heading}>
							{group.items.map((item) => (
								<CommandItem
									key={item.href}
									value={`${group.heading} ${item.label}`}
									keywords={item.keywords}
									onSelect={() => run(() => router.navigate({ to: item.href }))}
								>
									<BookText />
									<span className="truncate">{item.label}</span>
									<CommandShortcut className="font-mono text-[0.6875rem] tracking-normal">{item.hint}</CommandShortcut>
								</CommandItem>
							))}
						</CommandGroup>
					))}
			</CommandList>
		</CommandDialog>
	);
}
