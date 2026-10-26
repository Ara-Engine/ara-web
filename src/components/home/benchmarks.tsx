import { Gauge, TriangleAlert, Zap } from "lucide-react";
import { Panel } from "#/components/panel";
import { Section, SourceLink } from "#/components/section";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/ui/tooltip";
import { evidence, links } from "#/lib/site";
import { cn } from "#/lib/utils";

/** D26 GPU budgets (ms) at 2560×1440 on an RTX 4070 SUPER, per quality preset. */
const PRESETS = [
	{ name: "Low", budget: 2 },
	{ name: "Medium", budget: 3.5 },
	{ name: "High", budget: 6 },
	{ name: "Epic", budget: 10 },
] as const;

/** GPU p50 per scene, in preset order: the 0.0.1-alpha formal reading. */
const D26 = [
	{ scene: "Outpost", p50: [1.52, 3.04, 3.81, 5.39] },
	{ scene: "Hangar", p50: [1.26, 1.88, 3.14, 3.96] },
	{ scene: "Showcase", p50: [0.83, 1.26, 1.77, 2.69] },
] as const;

/**
 * Lower is better. Same machine, bit-exact results. `faster` is the published
 * figure (from unrounded timings), so it is quoted rather than recomputed.
 */
const HEAD_TO_HEAD = [
	{ task: "1M transforms", ara: 0.33, other: 0.53, faster: 37, rival: "Unity DOTS" },
	{ task: "1M particles", ara: 0.21, other: 0.51, faster: 58, rival: "Unity DOTS" },
	{ task: "Spawn/despawn churn", ara: 1.11, other: 2.59, faster: 57, rival: "Unity DOTS" },
	{ task: "1,000 actors × 65 bones", ara: 1.46, other: 1.99, faster: 27, rival: "ozz-animation" },
] as const;

/** The rest of the D26 formal reading: value against its target. */
const D26_EXTRA = [
	{ label: "CPU, Play p95", value: "2.41 ms", target: "4 ms" },
	{ label: "Frames over 16 ms after the first", value: "none", target: "none" },
	{ label: "Player cold loading frame", value: "0.72–0.99 s", target: "2 s" },
	{ label: "Player warm first scene", value: "1.24–1.91 s", target: "3 s" },
] as const;

export function Benchmarks() {
	return (
		<Section
			id="benchmarks"
			kicker="Benchmarks"
			title="Measured, with the misses published."
			lede="Every frame-time claim has a budget and every comparison runs on the same machine. Where Ara falls short, it says so."
		>
			<div className="grid gap-4 lg:grid-cols-2">
				<Panel title="Performance bar · D26" icon={Gauge} bodyClassName="flex flex-col">
					<p className="px-4 pt-3.5 text-[13px] leading-relaxed text-muted-foreground">
						GPU time (p50) at 2560 × 1440 against UE5-class budgets. Every row is inside its budget.
					</p>
					<table className="mt-2 w-full text-[12.5px]">
						<thead>
							<tr className="text-muted-foreground">
								<th className="px-4 py-2 text-left font-normal">Scene</th>
								{PRESETS.map((p) => (
									<th key={p.name} className="px-2 py-2 text-left font-normal">
										{p.name} <span className="text-muted-foreground/70">{p.budget}</span>
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{D26.map((row) => (
								<tr key={row.scene} className="border-t">
									<td className="px-4 py-3 text-foreground/90">{row.scene}</td>
									{row.p50.map((ms, i) => (
										<td key={PRESETS[i].name} className="px-2 py-3">
											<BudgetMeter ms={ms} budget={PRESETS[i].budget} />
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
					<dl className="mt-auto border-t text-[12.5px]">
						{D26_EXTRA.map((row) => (
							<div key={row.label} className="flex items-baseline gap-3 border-t px-4 py-2.5 first:border-t-0">
								<dt className="mr-auto text-foreground/90">{row.label}</dt>
								<dd className="font-mono tabular-nums">{row.value}</dd>
								<dd className="w-14 text-right text-[11.5px] text-muted-foreground">of {row.target}</dd>
							</div>
						))}
					</dl>
				</Panel>

				<Panel title="Head to head" icon={Zap} bodyClassName="flex flex-col">
					<div className="flex items-center gap-4 px-4 pt-3.5 text-[12px] text-muted-foreground">
						<span className="flex items-center gap-1.5">
							<span className="h-2 w-3 rounded-[2px] bg-primary" /> Ara
						</span>
						<span className="flex items-center gap-1.5">
							<span className="h-2 w-3 rounded-[2px] bg-muted-foreground/45" /> Comparison
						</span>
						<span className="ml-auto">ms · lower is better</span>
					</div>
					<ul className="mt-2">
						{HEAD_TO_HEAD.map((row) => (
							<li key={row.task} className="border-t px-4 py-3">
								<div className="mb-2 flex items-baseline justify-between text-[12.5px]">
									<span className="text-foreground/90">{row.task}</span>
									<span className="text-muted-foreground">
										{row.faster}% faster than {row.rival}
									</span>
								</div>
								<Bar label="Ara" ms={row.ara} max={row.other} className="bg-primary" />
								<Bar label={row.rival} ms={row.other} max={row.other} className="mt-1 bg-muted-foreground/45" />
							</li>
						))}
						<li className="flex items-center gap-2 border-t px-4 py-3 text-[12.5px]">
							<TriangleAlert className="size-3.5 shrink-0 text-warning-foreground" />
							<span className="text-foreground/90">Boids</span>
							<span className="text-muted-foreground">3.5–28% slower than Unity DOTS</span>
						</li>
					</ul>
					<p className="mt-auto border-t px-4 py-3 text-[12px] text-muted-foreground">
						Unity 6 IL2CPP + Burst and ozz-animation, on the same machine
					</p>
				</Panel>
			</div>

			<div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
				<p className="mr-auto text-[13.5px] text-muted-foreground">
					Not there yet: Jolt physics, boids, the 4 ms virtual-geometry target and the D27 record budgets.
				</p>
				<SourceLink href={evidence.performanceBar}>D26 reading</SourceLink>
				<SourceLink href={evidence.simulation}>Simulation</SourceLink>
				<SourceLink href={evidence.animation}>Animation</SourceLink>
				<SourceLink href={links.knownIssues}>Known issues</SourceLink>
			</div>
		</Section>
	);
}

/** A value against its budget: a meter whose track is a lighter step of the same hue. */
function BudgetMeter({ ms, budget }: { ms: number; budget: number }) {
	const share = Math.min(1, ms / budget);
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="cursor-default">
					<div className="font-mono text-[12px] tabular-nums">{ms.toFixed(2)}</div>
					<div className="mt-1.5 h-1 w-full max-w-16 rounded-full bg-primary/20">
						<div className="h-full rounded-full bg-primary" style={{ width: `${share * 100}%` }} />
					</div>
				</div>
			</TooltipTrigger>
			<TooltipContent>
				{ms.toFixed(2)} ms of a {budget} ms budget ({Math.round(share * 100)}%)
			</TooltipContent>
		</Tooltip>
	);
}

/** One emphasis bar, square at the baseline with a rounded data end; value at the tip. */
function Bar({ label, ms, max, className }: { label: string; ms: number; max: number; className: string }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="flex cursor-default items-center gap-2">
					<div className={cn("h-2 rounded-r-[4px]", className)} style={{ width: `${(ms / max) * 82}%` }} />
					<span className="font-mono text-[11.5px] text-muted-foreground tabular-nums">{ms.toFixed(2)}</span>
				</div>
			</TooltipTrigger>
			<TooltipContent>
				{label}: {ms.toFixed(2)} ms
			</TooltipContent>
		</Tooltip>
	);
}
