import { Terminal } from "lucide-react";
import type { ReactNode } from "react";
import { Nuqta } from "#/components/brand";
import { Panel } from "#/components/panel";
import { Section, SourceLink } from "#/components/section";
import { evidence } from "#/lib/site";
import { EditorDemo } from "./editor-demo";

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
			kicker="AI-native"
			title="Agents are first-class users, not an add-on."
			lede="Agent edits apply like a teammate's: live in the editor's activity feed, attributed, and undoable one turn at a time. Here is one turn."
		>
			<div className="mb-16 md:mb-24">
				<EditorDemo />
			</div>
			<div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
				<div className="flex flex-col">
					<ul className="space-y-7">
						{POINTS.map((p) => (
							<li key={p.title} className="flex gap-3.5">
								<Nuqta className="mt-[7px]" />
								<div>
									<h3 className="text-[15px] font-medium">{p.title}</h3>
									<p className="mt-1 text-[14.5px] leading-relaxed text-muted-foreground">{p.body}</p>
								</div>
							</li>
						))}
					</ul>
					<div className="mt-10 flex items-end justify-between gap-4 border-t pt-6">
						<p className="text-[14px] text-muted-foreground">
							<span className="mr-2 text-[28px] font-semibold tracking-[-0.03em] text-foreground">5–6</span>
							median turns per arabench task, down from 9
						</p>
						<SourceLink href={evidence.arabench} />
					</div>
				</div>

				<Panel
					title="Terminal"
					icon={Terminal}
					className="lg:self-start"
					actions={<span className="text-[11px]">levels/main.scene</span>}
				>
					<pre className="overflow-x-auto p-4 font-mono text-[12px] leading-[1.7] whitespace-pre-wrap text-muted-foreground md:p-5">
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
