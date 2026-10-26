import {
	Box,
	Boxes,
	Camera,
	Check,
	ChevronDown,
	Clapperboard,
	CloudSun,
	Eye,
	Grid3x3,
	Lightbulb,
	ListTree,
	type LucideIcon,
	Magnet,
	MousePointer2,
	Move,
	Pause,
	Play,
	Plus,
	RotateCcw,
	Search,
	SlidersHorizontal,
	Sparkles,
	Square,
	StepForward,
	Sun,
	Undo2,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { AraCrystal } from "#/components/brand";
import { useInView, useReducedMotion } from "#/lib/hooks";
import { cn } from "#/lib/utils";

/*
 * A scripted agent turn in the editor. Each phase is one op landing; the turn then
 * holds, is undone (per-turn undo is a real editor feature) and replays.
 * Commands, component fields, defaults and units match the engine's schema.
 */
type Phase = "prompt" | "created" | "light" | "color" | "intensity" | "done" | "undone";

/** Phases in turn order; `undone` sits outside it, so nothing counts as reached. */
const ORDER: readonly Phase[] = ["prompt", "created", "light", "color", "intensity", "done"];

const HOLD_MS: Record<Phase, number> = {
	prompt: 1600,
	created: 1100,
	light: 1000,
	color: 1000,
	intensity: 1300,
	done: 5200,
	undone: 1900,
};

const NEXT: Record<Phase, Phase> = {
	prompt: "created",
	created: "light",
	light: "color",
	color: "intensity",
	intensity: "done",
	done: "undone",
	undone: "prompt",
};

/** The light's colour values: scene data, not UI colours. */
const WHITE = "#FFFFFF";
const WARM = "#FFB46B";

/** Where the left hanging brazier sits in sponza.jpg, as % of the frame. */
const BRAZIER = { x: 27.4, y: 64.5 };

const OPS = [
	{ at: "created", cmd: "entity.create", detail: "Brazier light" },
	{ at: "light", cmd: "component.add", detail: "Light" },
	{ at: "color", cmd: "property.set", detail: "Light.color" },
	{ at: "intensity", cmd: "property.set", detail: "Light.intensity" },
] as const satisfies { at: Phase; cmd: string; detail: string }[];

function useAgentTurn(active: boolean, reduced: boolean) {
	const [phase, setPhase] = useState<Phase>("prompt");

	useEffect(() => {
		if (reduced) {
			setPhase((p) => (p === "undone" ? p : "done"));
			return;
		}
		if (!active) return;
		const timer = setTimeout(() => setPhase((p) => NEXT[p]), HOLD_MS[phase]);
		return () => clearTimeout(timer);
	}, [phase, active, reduced]);

	const reached = (p: Phase) => ORDER.indexOf(phase) >= ORDER.indexOf(p);

	return {
		phase,
		reached,
		undo: () => setPhase("undone"),
		replay: () => setPhase(reduced ? "done" : "prompt"),
	};
}

/** Animates a number towards `target`. */
function useTween(target: number, duration = 650) {
	const [value, setValue] = useState(target);
	const from = useRef(target);

	useEffect(() => {
		const start = performance.now();
		const begin = from.current;
		let frame = 0;
		const tick = (now: number) => {
			const t = Math.min(1, (now - start) / duration);
			const eased = 1 - (1 - t) ** 3;
			const next = begin + (target - begin) * eased;
			from.current = next;
			setValue(next);
			if (t < 1) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [target, duration]);

	return value;
}

/** The hero's editor window with a live agent turn. */
export function EditorDemo() {
	const ref = useRef<HTMLDivElement>(null);
	const inView = useInView(ref, { margin: "-80px" });
	const reduced = useReducedMotion();
	const turn = useAgentTurn(inView, reduced);

	const created = turn.reached("created");
	const hasLight = turn.reached("light");
	const warm = turn.reached("color");
	const bright = turn.reached("intensity");
	const intensity = useTween(bright ? 1600 : 800);

	return (
		<figure className="relative">
			<figcaption className="sr-only">
				The Ara editor showing the Sponza atrium. An agent adds a light to the left brazier, sets its colour and
				intensity, and the turn is undone as one step.
			</figcaption>
			<div
				ref={ref}
				aria-hidden
				className="overflow-hidden rounded-xl border border-separator-strong bg-chrome text-[12px] shadow-2xl shadow-primary/10"
			>
				<TitleBar />
				<div className="grid gap-px bg-border lg:grid-cols-[208px_minmax(0,1fr)_248px]">
					<div className="hidden min-h-0 flex-col gap-px lg:flex">
						<Hierarchy created={created} hasLight={hasLight} />
						<AgentsFeed turn={turn} className="min-h-0 flex-1" />
					</div>
					<Viewport created={created} hasLight={hasLight} warm={warm} bright={bright} />
					<Inspector created={created} hasLight={hasLight} warm={warm} bright={bright} intensity={intensity} />
					<AgentsFeed turn={turn} className="lg:hidden" />
				</div>
				<StatusBar done={turn.phase === "done"} />
			</div>
		</figure>
	);
}

function TitleBar() {
	return (
		<div className="flex h-9 items-center gap-1 border-b border-separator-strong px-2 text-[12.5px]">
			<span className="grid size-5 place-items-center rounded-[5px] bg-primary">
				<AraCrystal tone="white" className="size-3.5" />
			</span>
			<nav className="ml-1 hidden items-center md:flex">
				{["File", "Edit", "View", "Create", "Assets", "Play", "Tools", "Window", "Help"].map((m) => (
					<span key={m} className="rounded-xs px-2 py-0.5 text-foreground/85">
						{m}
					</span>
				))}
			</nav>
			<span className="ml-2 hidden items-center gap-1.5 text-muted-foreground xl:flex">
				Sponza <span className="text-separator-strong">›</span> atrium.scene
			</span>
			<div className="mx-auto flex items-center gap-0.5 rounded-sm border border-separator-strong bg-muted px-1 py-0.5 md:ml-auto md:mr-0 xl:mx-auto">
				<span className="flex items-center gap-1 rounded-xs px-1.5 text-foreground">
					<Play className="size-3 text-success-foreground" /> Play
				</span>
				<Pause className="mx-1 size-3 text-muted-foreground" />
				<StepForward className="mx-1 size-3 text-muted-foreground" />
				<Square className="mx-1 size-3 text-muted-foreground" />
				<span className="ml-1 flex items-center gap-1 border-l border-separator-strong pl-2 text-[11px] text-muted-foreground">
					Local <ChevronDown className="size-3" />
				</span>
			</div>
			<div className="ml-auto hidden h-6 w-56 items-center gap-1.5 rounded-sm border border-separator-strong bg-muted px-2 text-muted-foreground lg:ml-3 lg:flex">
				<Search className="size-3" />
				<span className="flex-1 truncate">Search or run a command…</span>
				<Keycap>Ctrl</Keycap>
				<Keycap>K</Keycap>
			</div>
		</div>
	);
}

function Keycap({ children }: { children: ReactNode }) {
	return (
		<span className="rounded-xs border border-separator-strong bg-keycap px-1 text-[10px] leading-4 text-muted-foreground">
			{children}
		</span>
	);
}

type Row = { name: string; icon: LucideIcon; depth?: number };

const SCENE: Row[] = [
	{ name: "atrium.scene", icon: Clapperboard },
	{ name: "Sun", icon: Sun, depth: 1 },
	{ name: "Sky atmosphere", icon: CloudSun, depth: 1 },
	{ name: "Atrium", icon: Box, depth: 1 },
	{ name: "Banners", icon: Boxes, depth: 1 },
	{ name: "Braziers", icon: Boxes, depth: 1 },
	{ name: "Main camera", icon: Camera, depth: 1 },
];

function Hierarchy({ created, hasLight }: { created: boolean; hasLight: boolean }) {
	return (
		<PanelChrome title="Hierarchy" icon={ListTree} className="shrink-0">
			<div className="mx-1.5 my-1.5 flex h-6 items-center gap-1.5 rounded-sm bg-muted px-2 text-muted-foreground">
				<Search className="size-3" /> Filter <span className="opacity-60">(t:Light)</span>
			</div>
			<ul className="px-1">
				{SCENE.map((row) => (
					<HierarchyRow key={row.name} row={row} />
				))}
				{created && (
					<HierarchyRow
						row={{
							name: "Brazier light",
							icon: hasLight ? Lightbulb : Box,
							depth: 1,
						}}
						selected
						className="animate-in fade-in-0 slide-in-from-left-2 duration-300"
					/>
				)}
			</ul>
		</PanelChrome>
	);
}

function HierarchyRow({ row, selected, className }: { row: Row; selected?: boolean; className?: string }) {
	const Icon = row.icon;
	return (
		<li
			className={cn(
				"flex h-5 items-center gap-1.5 rounded-xs pr-2",
				selected
					? "bg-selection-surface text-selection-foreground ring-1 ring-success ring-inset"
					: "text-foreground/90",
				className,
			)}
			style={{ paddingLeft: 6 + (row.depth ?? 0) * 12 }}
		>
			<Icon className={cn("size-3", selected ? "text-selection-foreground" : "text-muted-foreground")} />
			<span className="truncate">{row.name}</span>
			{selected && <span className="ml-auto text-[10px] text-selection-muted-foreground">agent</span>}
		</li>
	);
}

type Turn = ReturnType<typeof useAgentTurn>;

function AgentsFeed({ turn, className }: { turn: Turn; className?: string }) {
	const undone = turn.phase === "undone";
	const pending = OPS.find((op) => !turn.reached(op.at));

	return (
		<PanelChrome title="Agents" icon={Sparkles} className={className}>
			<div className="flex flex-col gap-2.5 p-2.5">
				<div className="rounded-md bg-raised px-2.5 py-2">
					<div className="mb-0.5 text-[10.5px] text-muted-foreground">you</div>
					<div className="text-foreground">Add a warm light to the left brazier.</div>
				</div>
				<div>
					<div className="mb-1 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
						<span className="size-1.5 rounded-full bg-primary" />
						agent:claude
						<span className="ml-auto">turn 3</span>
					</div>
					<ul className="space-y-0.5 font-mono text-[11px]">
						{OPS.map((op) => {
							const landed = turn.reached(op.at) || undone;
							if (!landed) return null;
							return (
								<li
									key={op.at}
									className={cn(
										"flex items-center gap-1.5 animate-in fade-in-0 duration-300",
										undone && "text-muted-foreground line-through decoration-muted-foreground/60",
									)}
								>
									<Check
										className={cn("size-3 shrink-0", undone ? "text-muted-foreground" : "text-success-foreground")}
									/>
									<span className={undone ? "" : "text-foreground"}>{op.cmd}</span>
									<span className="truncate text-muted-foreground">{op.detail}</span>
								</li>
							);
						})}
						{!undone && pending && (
							<li className="flex items-center gap-1.5 text-muted-foreground">
								<span className="ml-1 size-1.5 animate-pulse-dot rounded-full bg-primary" />
								<span className="ml-1">{turn.phase === "prompt" ? "thinking…" : "applying…"}</span>
							</li>
						)}
					</ul>
				</div>
				{(turn.phase === "done" || undone) && (
					<div className="flex items-center gap-2 border-t pt-2 text-[11px] animate-in fade-in-0 duration-300">
						<span className="text-muted-foreground">{undone ? "4 ops reverted" : "4 ops applied"}</span>
						<button
							type="button"
							tabIndex={-1}
							onClick={undone ? turn.replay : turn.undo}
							className="ml-auto flex items-center gap-1 rounded-sm border border-separator-strong bg-raised px-1.5 py-0.5 text-foreground hover:bg-hover-surface"
						>
							{undone ? <RotateCcw className="size-3" /> : <Undo2 className="size-3" />}
							{undone ? "Replay" : "Undo turn"}
						</button>
					</div>
				)}
			</div>
		</PanelChrome>
	);
}

type LightState = {
	created: boolean;
	hasLight: boolean;
	warm: boolean;
	bright: boolean;
};

function Viewport({ created, hasLight, warm, bright }: LightState) {
	return (
		<div className="flex min-w-0 flex-col bg-card">
			<div className="flex h-7 items-center gap-0.5 border-b bg-panel-header px-1.5">
				{["Scene", "Game", "Material", "VFX", "Animation", "Profiler"].map((tab, i) => (
					<span
						key={tab}
						className={cn(
							"relative px-2 py-1 text-muted-foreground",
							i === 0 &&
								"text-foreground after:absolute after:inset-x-1.5 after:-bottom-[5px] after:h-px after:bg-primary",
							i > 2 && "hidden sm:inline",
						)}
					>
						{tab}
					</span>
				))}
			</div>
			<div className="flex h-7 items-center gap-1 border-b px-1.5 text-muted-foreground">
				<MousePointer2 className="mx-1 size-3" />
				<span className="flex items-center gap-1 rounded-xs bg-selection-surface px-1.5 py-0.5 text-selection-foreground">
					<Move className="size-3" /> Move
				</span>
				<span className="ml-1 hidden sm:inline">World</span>
				<span className="mx-1 hidden h-3 w-px bg-separator-strong sm:block" />
				<Grid3x3 className="size-3" /> 0.5 m
				<Magnet className="ml-2 size-3" /> 15°
				<span className="ml-auto hidden items-center gap-3 md:flex">
					<span>Perspective</span>
					<span className="flex items-center gap-1">
						<Sun className="size-3" /> Lit · Fidelity
					</span>
					<span className="flex items-center gap-1">
						<Eye className="size-3" /> Show
					</span>
				</span>
			</div>
			<div className="relative aspect-video overflow-hidden bg-background">
				<img
					src="/media/sponza.jpg"
					alt=""
					width={1920}
					height={1080}
					fetchPriority="high"
					className="absolute inset-0 size-full object-cover"
				/>
				<LightGlow color={WHITE} opacity={hasLight && !warm ? 0.5 : 0} />
				<LightGlow color={WARM} opacity={warm ? (bright ? 1 : 0.55) : 0} />
				{created && <Gizmo showRange={hasLight} />}
				<AxisGizmo />
			</div>
		</div>
	);
}

/** Additive pool of light around the brazier; two layers cross-fade colour and strength. */
function LightGlow({ color, opacity }: { color: string; opacity: number }) {
	const at = `${BRAZIER.x}% ${BRAZIER.y}%`;
	return (
		<div
			className="pointer-events-none absolute inset-0 mix-blend-screen transition-opacity duration-700"
			style={{
				opacity,
				background: `radial-gradient(circle at ${at}, color-mix(in srgb, ${color} 80%, transparent) 0%, transparent 9%),
					radial-gradient(ellipse 22% 30% at ${at}, color-mix(in srgb, ${color} 34%, transparent) 0%, transparent 100%)`,
			}}
		/>
	);
}

/** The editor's translate gizmo on the selected entity, plus its light range when it has one. */
function Gizmo({ showRange }: { showRange: boolean }) {
	return (
		<svg
			aria-hidden="true"
			viewBox="-80 -60 160 120"
			className="absolute h-[28%] -translate-x-1/2 -translate-y-1/2 animate-in fade-in-0 zoom-in-90 duration-300"
			style={{ left: `${BRAZIER.x}%`, top: `${BRAZIER.y}%` }}
		>
			<ellipse
				rx="66"
				ry="30"
				fill="none"
				strokeDasharray="3 4"
				strokeWidth="1"
				className={cn("stroke-foreground/40 transition-opacity duration-500", showRange ? "opacity-100" : "opacity-0")}
			/>
			<line x2="34" y2="10" strokeWidth="2.5" className="stroke-destructive" />
			<line y2="-38" strokeWidth="2.5" className="stroke-success" />
			<line x2="-24" y2="18" strokeWidth="2.5" className="stroke-info" />
			<circle cx="34" cy="10" r="4" className="fill-destructive" />
			<circle cy="-38" r="4" className="fill-success" />
			<circle cx="-24" cy="18" r="4" className="fill-info" />
			<circle r="3.5" className="fill-foreground" />
		</svg>
	);
}

function AxisGizmo() {
	return (
		<svg aria-hidden="true" viewBox="-20 -20 40 40" className="absolute top-3 right-3 size-10 opacity-90">
			<line x2="12" y2="4" strokeWidth="2" className="stroke-destructive" />
			<line y2="-13" strokeWidth="2" className="stroke-success" />
			<line x2="-9" y2="7" strokeWidth="2" className="stroke-info" />
			<circle cx="12" cy="4" r="3" className="fill-destructive" />
			<circle cy="-13" r="3" className="fill-success" />
			<circle cx="-9" cy="7" r="3" className="fill-info" />
		</svg>
	);
}

function Inspector({ created, hasLight, warm, bright, intensity }: LightState & { intensity: number }) {
	return (
		<PanelChrome title="Inspector" icon={SlidersHorizontal} className="hidden lg:flex">
			{!created ? (
				<div className="flex h-full flex-col items-center justify-center gap-1.5 px-6 pb-8 text-center">
					<SlidersHorizontal className="size-4 text-muted-foreground" />
					<div className="text-foreground">Nothing selected</div>
					<div className="text-[11px] leading-snug text-muted-foreground">
						Select an entity in the Scene or Hierarchy to edit its components.
					</div>
				</div>
			) : (
				<div className="animate-in fade-in-0 duration-300">
					<div className="flex items-center gap-1.5 border-b px-2 py-1.5">
						{hasLight ? (
							<Lightbulb className="size-3 text-muted-foreground" />
						) : (
							<Box className="size-3 text-muted-foreground" />
						)}
						<span className="flex-1 rounded-xs bg-muted px-1.5 py-0.5 text-foreground">Brazier light</span>
					</div>
					<Component name="Transform" icon={Move}>
						<Field label="Position" changed>
							<Vec3 values={["-3.4", "2.2", "5.8"]} />
						</Field>
						<Field label="Rotation">
							<Vec3 values={["0", "0", "0"]} />
						</Field>
						<Field label="Scale">
							<Vec3 values={["1", "1", "1"]} />
						</Field>
					</Component>
					{hasLight && (
						<Component name="Light" icon={Lightbulb} className="animate-in fade-in-0 slide-in-from-top-1 duration-300">
							<Field label="Kind">
								<Select value="Point" />
							</Field>
							<Field label="Color" changed={warm} agent={warm}>
								<span className="flex flex-1 items-center gap-1.5 rounded-xs bg-muted px-1.5 py-0.5">
									<span
										className="size-3 rounded-[3px] border border-separator-strong transition-colors duration-500"
										style={{ background: warm ? WARM : WHITE }}
									/>
									<span className="font-mono text-[11px]">{warm ? WARM : WHITE}</span>
								</span>
							</Field>
							<Field label="Intensity" changed={bright} agent={bright}>
								<Num value={Math.round(intensity).toLocaleString("en-US")} unit="lm" />
							</Field>
							<Field label="Range">
								<Num value="10" unit="m" />
							</Field>
						</Component>
					)}
					<div className="p-2">
						<div className="flex items-center justify-center gap-1 rounded-sm border border-separator-strong bg-raised py-1 text-foreground/90">
							<Plus className="size-3" /> Add component
						</div>
					</div>
				</div>
			)}
		</PanelChrome>
	);
}

function Component({
	name,
	icon: Icon,
	className,
	children,
}: {
	name: string;
	icon: LucideIcon;
	className?: string;
	children: ReactNode;
}) {
	return (
		<div className={cn("border-b pb-1", className)}>
			<div className="flex items-center gap-1.5 px-2 py-1.5 text-foreground">
				<ChevronDown className="size-3 text-muted-foreground" />
				<Icon className="size-3 text-muted-foreground" />
				{name}
			</div>
			<div className="space-y-0.5">{children}</div>
		</div>
	);
}

/** An inspector row. `changed` draws the non-default bar; `agent` the modified-by-agent tint. */
function Field({
	label,
	changed,
	agent,
	children,
}: {
	label: string;
	changed?: boolean;
	agent?: boolean;
	children: ReactNode;
}) {
	return (
		<div className="relative flex h-6 items-center gap-2 pr-2 pl-3">
			{changed && <span className="absolute top-1 bottom-1 left-0.5 w-0.5 rounded-full bg-primary" />}
			<span className="w-[64px] shrink-0 text-foreground/80">{label}</span>
			<span
				className={cn(
					"flex min-w-0 flex-1 items-center rounded-xs transition-shadow duration-500",
					agent && "ring-1 ring-warning/70",
				)}
			>
				{children}
			</span>
		</div>
	);
}

function Vec3({ values }: { values: [string, string, string] }) {
	return (
		<span className="grid flex-1 grid-cols-3 gap-1">
			{(["X", "Y", "Z"] as const).map((axis, i) => (
				<span key={axis} className="flex items-center gap-1 rounded-xs bg-muted px-1 py-0.5">
					<span className="text-[10px] text-muted-foreground">{axis}</span>
					<span className="ml-auto font-mono text-[11px] tabular-nums">{values[i]}</span>
				</span>
			))}
		</span>
	);
}

function Num({ value, unit }: { value: string; unit: string }) {
	return (
		<span className="flex flex-1 items-center rounded-xs bg-muted px-1.5 py-0.5">
			<span className="font-mono text-[11px] tabular-nums">{value}</span>
			<span className="ml-auto text-[10.5px] text-muted-foreground">{unit}</span>
		</span>
	);
}

function Select({ value }: { value: string }) {
	return (
		<span className="flex flex-1 items-center rounded-xs border border-separator-strong bg-raised px-1.5 py-0.5">
			{value}
			<ChevronDown className="ml-auto size-3 text-muted-foreground" />
		</span>
	);
}

function StatusBar({ done }: { done: boolean }) {
	return (
		<div className="flex h-6 items-center gap-4 border-t border-separator-strong px-2.5 text-[11px] text-muted-foreground">
			<span className="flex items-center gap-1.5">
				<span className="size-1.5 rounded-full bg-success" /> Connected
			</span>
			<span className="hidden sm:inline">9 entities · 1 selected</span>
			<span className={cn("hidden transition-opacity duration-300 sm:inline", done ? "opacity-100" : "opacity-0")}>
				agent:claude · 4 ops · undo per turn
			</span>
			<span className="ml-auto hidden xl:inline">W E R tools · F Frame · Ctrl+K Commands</span>
			<span className="font-mono tabular-nums">115 FPS · 8.70 ms</span>
		</div>
	);
}

/** Panel chrome sized for the dense editor mock (same anatomy as `Panel`). */
function PanelChrome({
	title,
	icon: Icon,
	className,
	children,
}: {
	title: string;
	icon: LucideIcon;
	className?: string;
	children: ReactNode;
}) {
	return (
		<div className={cn("flex min-h-0 flex-col bg-card", className)}>
			<div className="flex h-7 shrink-0 items-center gap-1.5 border-b bg-panel-header px-2.5 text-foreground/90">
				<Icon className="size-3 text-muted-foreground" />
				{title}
			</div>
			<div className="min-h-0 flex-1 overflow-hidden">{children}</div>
		</div>
	);
}
