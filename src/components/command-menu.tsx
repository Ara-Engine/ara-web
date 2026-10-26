import type { LucideIcon } from "lucide-react";
import {
	ArrowUpRight,
	BookOpen,
	Download,
	FileText,
	Github,
	Hash,
	ListChecks,
	Milestone,
	TriangleAlert,
} from "lucide-react";
import { useEffect } from "react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandShortcut,
} from "#/components/ui/command";
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
 * The site's command palette, like the editor's "Search or run a command…".
 * Ctrl/⌘+K toggles it; `open` is owned by the header so its button can open it too.
 */
export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
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

	const goTo = (id: string) => {
		document.getElementById(id)?.scrollIntoView();
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
			<CommandInput placeholder="Search or run a command…" />
			<CommandList className="max-h-[22.5rem]">
				<CommandEmpty>No matching command.</CommandEmpty>
				<CommandGroup heading="Go to">
					{sections.map((s) => (
						<CommandItem key={s.id} value={`go to ${s.label}`} onSelect={() => run(() => goTo(s.id))}>
							<Hash />
							{s.label}
						</CommandItem>
					))}
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
			</CommandList>
		</CommandDialog>
	);
}
