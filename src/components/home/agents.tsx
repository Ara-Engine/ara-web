import { Terminal } from "lucide-react";
import type { ReactNode } from "react";
import { AraCrystal } from "#/components/brand";
import { Panel } from "#/components/panel";
import { FloorLight, Section, SourceLink } from "#/components/section";
import { evidence } from "#/lib/site";
import { EditorDemo } from "./editor-demo";

/** Four pillars, one per facet of the mark (top left, top right, bottom left, bottom right). */
const POINTS = [
	{
		title: "One command registry",
		body: "Menus, the palette, shortcuts, the ara CLI, C# and MCP all run the same 272 typed commands. Each edit is an undoable transaction with an author and a reason.",
	},
	{
		title: "A built-in MCP server",
		body: "Claude Code, Codex or any MCP client gets the editor's own tools. One global connection through Ara Hub sees every registered project.",
	},
	{
		title: "ara why",
		body: "Explains a problem from diagnostics gathered across every subsystem, with ranked causes, evidence and fixes an agent can run.",
	},
	{
		title: "Worlds as text that merges",
		body: "Scenes are canonical JSON with @path#id references, and ara merge three-way merges them, so agents and people can branch freely.",
	},
] as const;

export function Agents() {
	return (
		<Section
			id="agents"
			index="01"
			kicker="AI-native"
			title={
				<>
					Agents are first-class users, <span className="text-foreground/35">not an add-on.</span>
				</>
			}
			lede="Agent edits apply like a teammate's: live in the editor's activity feed, attributed, and undoable one turn at a time. Here is one turn."
		>
			{/* The editor stands in the light: a pool of lattice light on the floor and a glow behind. */}
			<div className="relative">
				<FloorLight className="-inset-x-[20%] -bottom-[22%] h-[70%]" />
				<div
					aria-hidden
					className="absolute inset-x-[5%] top-[5%] bottom-[-10%] -z-10 bg-[radial-gradient(closest-side,rgb(255_255_255/0.09),transparent)]"
				/>
				<div className="stage-rise">
					<EditorDemo />
				</div>
			</div>

			<ul className="mt-24 grid gap-x-10 gap-y-12 sm:grid-cols-2 md:mt-32 lg:grid-cols-4">
				{POINTS.map((p, i) => (
					<li key={p.title} className="group relative border-t border-white/12 pt-7">
						<span
							aria-hidden
							className="absolute -top-px left-0 h-px w-10 bg-white transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full"
						/>
						<AraCrystal
							lit={i}
							className="size-10 transition-[filter] duration-500 group-hover:drop-shadow-[0_0_10px_rgb(255_255_255/0.5)]"
						/>
						<h3 className="mt-6 text-[1.1875rem] font-medium tracking-[-0.02em]">{p.title}</h3>
						<p className="mt-2.5 text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">{p.body}</p>
					</li>
				))}
			</ul>

			<div className="mt-24 grid grid-cols-[minmax(0,1fr)] gap-12 md:mt-32 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center lg:gap-16">
				<Panel title="Terminal" icon={Terminal} actions={<span className="text-[0.6875rem]">levels/main.scene</span>}>
					<pre className="overflow-x-auto p-4 font-mono text-[0.75rem] leading-[1.7] whitespace-pre-wrap text-muted-foreground md:p-5">
						<Cmd>ara do entity.create -p name=Lamp --why "Light the crate"</Cmd>
						{"applied tx_rgxnv0fs to levels/main.scene (revision 1)\n"}
						{"  created: "}
						<Em>e_wvxb Lamp</Em>
						{'\nundo this turn: ara_session {"action": "rollback", "to": "cp_0cjgacmx"}\n\n'}
						<Cmd>ara why name:Lamp not visible</Cmd>
						<Em>{"why is `Lamp` (e_wvxb) in levels/main.scene not visible: 2 causes, 1 certain\n"}</Em>
						{"1. "}
						<Em>[high]</Em>
						{" `Lamp` (e_wvxb) has no renderer component, so it has nothing to draw "}
						<Code>(ARA3301)</Code>
						{"\n   "}
						<Fix>fix:</Fix>
						{' Add a `MeshRenderer`: component.add {"entity":"e_wvxb","component":"MeshRenderer"}\n'}
						{"2. "}
						<Em>[medium]</Em>
						{" `levels/main.scene` has no enabled camera, so nothing in it is drawn in game "}
						<Code>(ARA3310)</Code>
						{"\n   "}
						<Fix>then:</Fix>
						{" add an entity with a `Camera` component (`entity.create`)\n"}
					</pre>
				</Panel>

				<div>
					<p className="font-mono text-[0.6875rem] tracking-[0.18em] text-muted-foreground uppercase">Turns per task</p>
					<p className="mt-5 bg-gradient-to-b from-white to-white/45 bg-clip-text text-[6rem] leading-none font-extralight tracking-[-0.06em] text-transparent md:text-[8rem]">
						5–6
					</p>
					<p className="mt-5 max-w-[22rem] text-[1rem] leading-relaxed text-muted-foreground">
						Median turns an agent takes per arabench task, down from 9.
					</p>
					<div className="mt-6">
						<SourceLink href={evidence.arabench} />
					</div>
				</div>
			</div>
		</Section>
	);
}

function Cmd({ children }: { children: ReactNode }) {
	return (
		<span className="text-foreground">
			<span className="text-muted-foreground select-none">$ </span>
			{children}
			{"\n"}
		</span>
	);
}

function Em({ children }: { children: ReactNode }) {
	return <span className="text-foreground/90">{children}</span>;
}

function Code({ children }: { children: ReactNode }) {
	return <span className="text-foreground underline decoration-separator-strong underline-offset-2">{children}</span>;
}

function Fix({ children }: { children: ReactNode }) {
	return <span className="text-success-foreground">{children}</span>;
}
