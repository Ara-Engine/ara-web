import { AraLogo } from "#/components/brand";
import { ENGINE_VERSION, links } from "#/lib/site";

const COLUMNS = [
	{
		title: "Get Ara",
		links: [
			{ label: "Download Ara Hub", href: links.hubInstaller },
			{ label: "Release notes", href: links.releaseNotes },
			{ label: "All releases", href: links.releases },
		],
	},
	{
		title: "Engine",
		links: [
			{ label: "GitHub", href: links.repo },
			{ label: "Known issues", href: links.knownIssues },
			{ label: "Decisions", href: links.decisions },
			{ label: "Milestones", href: links.milestones },
		],
	},
] as const;

/** Link columns over a strip styled as the editor's status bar. */
export function SiteFooter() {
	return (
		<footer className="mt-10 border-t">
			<div className="mx-auto flex max-w-content flex-col gap-10 px-5 py-12 md:flex-row md:px-8">
				<div className="max-w-[18.75rem]">
					<AraLogo className="text-[1.375rem]" />
					<p className="mt-4 text-[0.84375rem] leading-relaxed text-muted-foreground">
						An AI-native game engine in Rust. AI agents build it; agents and humans make games with it.
					</p>
				</div>
				<div className="flex gap-16 md:ml-auto">
					{COLUMNS.map((col) => (
						<div key={col.title}>
							<h3 className="text-[0.8125rem] font-medium">{col.title}</h3>
							<ul className="mt-3 space-y-2 text-[0.84375rem]">
								{col.links.map((l) => (
									<li key={l.label}>
										<a href={l.href} className="text-muted-foreground transition-colors hover:text-foreground">
											{l.label}
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</div>
			<div className="border-t border-separator-strong bg-chrome">
				<div className="mx-auto flex max-w-content flex-wrap items-center gap-x-4 gap-y-1 px-5 py-2 text-[0.71875rem] text-muted-foreground md:px-8">
					<span className="flex items-center gap-1.5">
						<span className="size-1.5 rounded-full bg-success" /> ara {ENGINE_VERSION}
					</span>
					<span>Windows · Vulkan 1.3</span>
					<span>C# 14 / .NET 10</span>
					<span className="md:ml-auto">
						Sponza by Frank Meinl, Crytek (CC BY 3.0) · © {new Date().getFullYear()} Ara Engine
					</span>
				</div>
			</div>
		</footer>
	);
}
