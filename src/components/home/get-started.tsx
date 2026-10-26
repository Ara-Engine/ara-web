import { Download, Github } from "lucide-react";
import type { ReactNode } from "react";
import { AraMark } from "#/components/brand";
import { CopyButton } from "#/components/copy-button";
import { Section } from "#/components/section";
import { Button } from "#/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { ENGINE_VERSION, links } from "#/lib/site";

/** One numbered card: text, then an optional copyable command and/or action button. */
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
			<Button asChild className="w-fit">
				<a href={links.hubInstaller}>
					<Download />
					Download for Windows
				</a>
			</Button>
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
				<code className="font-mono text-[13px] text-foreground">ara init</code> writes a per-project{" "}
				<code className="font-mono text-[13px] text-foreground">.mcp.json</code>, so an agent started in the folder
				connects on its own. The CLI works too.
			</>
		),
		code: 'ara do entity.create -p name=Lamp --why "Light the crate"',
	},
];

export function GetStarted() {
	return (
		<Section id="get-started" kicker="Get started" title="From download to your first agent turn.">
			<Tabs defaultValue="tester">
				<TabsList className="mb-6 h-9 border border-separator-strong bg-muted">
					<TabsTrigger
						value="tester"
						className="px-4 data-[state=active]:border-transparent data-[state=active]:bg-selection-surface data-[state=active]:text-selection-foreground"
					>
						Make a game
					</TabsTrigger>
					<TabsTrigger
						value="developer"
						className="px-4 data-[state=active]:border-transparent data-[state=active]:bg-selection-surface data-[state=active]:text-selection-foreground"
					>
						Build from source
					</TabsTrigger>
				</TabsList>
				<TabsContent value="tester">
					<Steps steps={TESTER} />
				</TabsContent>
				<TabsContent value="developer">
					<Steps steps={DEVELOPER} />
				</TabsContent>
			</Tabs>
			<p className="mt-6 text-[12.5px] text-muted-foreground">
				Needs Windows 10/11 x64, a Vulkan 1.3 GPU with a current driver, 16 GB RAM and the .NET 10 runtime. macOS (Metal
				4) is next.
			</p>

			<div className="relative mt-24 overflow-hidden rounded-xl border bg-card px-6 py-16 text-center md:py-20">
				<div
					aria-hidden
					className="bg-viewport-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_80%_at_50%_100%,black,transparent)]"
				/>
				<AraMark className="relative mx-auto size-12" />
				<h2 className="relative mt-6 text-[30px] font-semibold tracking-[-0.03em] md:text-[40px]">
					Make something with Ara.
				</h2>
				<p className="relative mx-auto mt-3 max-w-[460px] text-[15.5px] text-muted-foreground">
					It's an early alpha for testers and agents. Tell us what breaks.
				</p>
				<div className="relative mt-8 flex flex-wrap justify-center gap-3">
					<Button asChild size="lg" className="h-11 px-5 text-[14px]">
						<a href={links.hubInstaller}>
							<Download />
							Download Ara Hub
						</a>
					</Button>
					<Button asChild size="lg" variant="outline" className="h-11 px-5 text-[14px]">
						<a href={`${links.repo}/issues`} target="_blank" rel="noreferrer">
							<Github />
							Report an issue
						</a>
					</Button>
				</div>
			</div>
		</Section>
	);
}

function Steps({ steps }: { steps: Step[] }) {
	return (
		<ol className="grid gap-4 md:grid-cols-3">
			{steps.map((step, i) => (
				<li key={step.title} className="flex flex-col rounded-lg border bg-card p-5">
					<span className="grid size-6 place-items-center rounded-full border border-separator-strong bg-raised font-mono text-[11px] text-muted-foreground">
						{i + 1}
					</span>
					<h3 className="mt-4 text-[15px] font-medium">{step.title}</h3>
					<p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{step.body}</p>
					{(step.code || step.action) && (
						<div className="mt-auto pt-5">
							{step.code && (
								<div className="flex items-start gap-2 rounded-md border bg-background pl-3">
									<pre className="min-w-0 flex-1 py-2.5 font-mono whitespace-pre-wrap [overflow-wrap:anywhere] text-[11.5px] leading-relaxed text-foreground/90">
										{step.code}
									</pre>
									<CopyButton text={step.code} className="mt-1 mr-1" />
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
