import { Download } from "lucide-react";
import { Tabs } from "radix-ui";
import type { ReactNode } from "react";
import { CopyButton } from "#/components/copy-button";
import { FacetButton } from "#/components/facet-button";
import { Section } from "#/components/section";
import { ENGINE_VERSION, links } from "#/lib/site";
import { cn } from "#/lib/utils";

/** One step on the path: text, then an optional copyable command and/or action button. */
type Step = {
	title: string;
	body: ReactNode;
	code?: string;
	action?: ReactNode;
};

const TESTER: Step[] = [
	{
		title: "Install Ara Hub",
		body: (
			<>
				Hub installs engine versions side by side and keeps itself up to date. This alpha isn't code-signed yet, so
				SmartScreen may warn.
			</>
		),
		action: (
			<FacetButton asChild className="w-fit">
				<a href={links.hubInstaller}>
					<Download />
					Download for Windows
				</a>
			</FacetButton>
		),
	},
	{
		title: "Create a project",
		body: (
			<>
				In <b className="font-medium text-foreground">Installs</b>, pick{" "}
				<b className="font-medium text-foreground">Preview</b> and install engine {ENGINE_VERSION}. Then start a
				Starter, Outpost or Material showcase project and press Play.
			</>
		),
	},
	{
		title: "Connect your agent",
		body: (
			<>
				Hub's <b className="font-medium text-foreground">Connect an AI agent</b> page gives Claude Code or Codex a
				one-line setup. One global MCP server covers every project.
			</>
		),
		code: "claude mcp add --scope user ara -- '…\\ara.exe' mcp",
	},
];

const DEVELOPER: Step[] = [
	{
		title: "Install the prerequisites",
		body: (
			<>
				Rust (rustup installs the pinned toolchain), MSVC Build Tools with the Windows SDK, the Vulkan SDK and the .NET
				10 SDK. No CMake or Python.
			</>
		),
	},
	{
		title: "Build and open a project",
		body: <>The first build takes a while.</>,
		code: [
			"git clone https://github.com/Ara-Engine/ara && cd ara",
			"cargo build -p ara -p ara-editor -p ara-player",
			"cargo run -p ara -- init my-game",
			"cargo run -p ara-editor -- my-game --sample",
		].join("\n"),
	},
	{
		title: "Let agents in",
		body: (
			<>
				<code className="font-mono text-[0.8125rem] text-foreground">ara init</code> writes a per-project{" "}
				<code className="font-mono text-[0.8125rem] text-foreground">.mcp.json</code>, so an agent started in the folder
				connects on its own. The CLI works too.
			</>
		),
		code: 'ara do entity.create -p name=Lamp --why "Light the crate"',
	},
];

export function GetStarted() {
	return (
		<Section
			id="get-started"
			index="04"
			kicker="Get started"
			title={
				<>
					From download <span className="text-foreground/35">to your first agent turn.</span>
				</>
			}
		>
			<Tabs.Root defaultValue="tester">
				<Tabs.List aria-label="Ways to start" className="mb-14 flex gap-8 border-b border-white/12">
					{TRACKS.map((t) => (
						<Tabs.Trigger
							key={t.value}
							value={t.value}
							className={cn(
								"relative -mb-px pb-4 text-[1rem] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground data-[state=active]:text-foreground",
								// The tab's light: a lit line under it, full when active, faint on hover or focus.
								"after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white after:opacity-0 after:shadow-[0_0_12px_rgb(255_255_255/0.8)] after:transition-opacity",
								"hover:after:opacity-30 focus-visible:after:opacity-60 data-[state=active]:after:opacity-100",
							)}
						>
							{t.label}
						</Tabs.Trigger>
					))}
				</Tabs.List>
				{TRACKS.map((t) => (
					<Tabs.Content key={t.value} value={t.value} className="outline-none">
						<Steps steps={t.steps} />
					</Tabs.Content>
				))}
			</Tabs.Root>
			<p className="mt-14 text-[0.8125rem] text-muted-foreground">
				Needs Windows 10/11 x64, a Vulkan 1.3 GPU with a current driver, 16 GB RAM and the .NET 10 runtime. macOS (Metal
				4) is next.
			</p>
		</Section>
	);
}

const TRACKS = [
	{ value: "tester", label: "Make a game", steps: TESTER },
	{ value: "developer", label: "Build from source", steps: DEVELOPER },
] as const;

/** The steps as a path: one lit line through a node per step, the first one glowing. */
function Steps({ steps }: { steps: Step[] }) {
	return (
		<ol className="relative grid gap-14 md:grid-cols-3 md:gap-10">
			<span
				aria-hidden
				className="absolute top-[0.4375rem] right-0 left-0 hidden h-px bg-gradient-to-r from-white/70 via-white/15 to-white/5 md:block"
			/>
			{steps.map((step, i) => (
				<li key={step.title} className="relative flex flex-col">
					<span
						aria-hidden
						className={cn(
							"relative grid size-3.5 rotate-45 place-items-center border bg-background",
							i === 0 ? "border-white shadow-[0_0_16px_rgb(255_255_255/0.6)]" : "border-white/35",
						)}
					>
						{i === 0 && <span className="size-1 bg-white" />}
					</span>
					<p className="mt-8 font-mono text-[0.6875rem] tracking-[0.18em] text-muted-foreground uppercase">
						Step {String(i + 1).padStart(2, "0")}
					</p>
					<h3 className="mt-3 text-[1.5rem] font-semibold tracking-[-0.03em]">{step.title}</h3>
					<p className="mt-3 text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">{step.body}</p>
					{(step.code || step.action) && (
						<div className="mt-auto pt-7">
							{step.code && (
								<div className="flex items-start gap-2 border border-white/10 bg-white/[0.03] pl-3.5">
									<pre className="min-w-0 flex-1 py-3 font-mono text-[0.75rem] leading-relaxed whitespace-pre-wrap text-foreground/90 [overflow-wrap:anywhere]">
										{step.code}
									</pre>
									<CopyButton text={step.code} className="mt-1.5 mr-1.5" />
								</div>
							)}
							{step.action}
						</div>
					)}
				</li>
			))}
		</ol>
	);
}
