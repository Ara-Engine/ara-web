import { TriangleAlert } from "lucide-react";
import { useRef } from "react";
import { Section, SourceLink } from "#/components/section";
import { useInView } from "#/lib/hooks";
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

const LABEL = "font-mono text-[0.6875rem] tracking-[0.18em] text-muted-foreground uppercase";

export function Benchmarks() {
	const ref = useRef<HTMLDivElement>(null);
	const seen = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });

	return (
		<Section
			id="benchmarks"
			index="03"
			kicker="Benchmarks"
			title={
				<>
					Measured, <span className="text-foreground/35">with the misses published.</span>
				</>
			}
			lede="Every frame-time claim has a budget and every comparison runs on the same machine. Where Ara falls short, it says so."
		>
			<div ref={ref}>
				<div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-white/12 pb-4">
					<h3 className={cn(LABEL, "mr-auto")}>Head to head · same machine</h3>
					<span className="flex items-center gap-2 text-[0.8125rem] text-foreground/80">
						<span className="h-1.5 w-5 bg-white shadow-[0_0_10px_rgb(255_255_255/0.6)]" /> Ara
					</span>
					<span className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground">
						<span className="h-1.5 w-5 bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.35)_0_1.5px,transparent_1.5px_4px)]" />{" "}
						Comparison
					</span>
					<span className="text-[0.8125rem] text-muted-foreground">ms · lower is better</span>
				</div>

				<ul>
					{HEAD_TO_HEAD.map((row, i) => (
						<li
							key={row.task}
							className="grid items-center gap-x-10 gap-y-4 border-b border-white/8 py-7 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_9rem]"
						>
							<div>
								<p className="text-[1.125rem] font-medium tracking-[-0.015em]">{row.task}</p>
								<p className="mt-1 font-mono text-[0.71875rem] text-muted-foreground">vs {row.rival}</p>
							</div>
							<div className="space-y-2">
								<Beam ms={row.ara} share={row.ara / row.other} shown={seen} delay={i * 120} lit />
								<Beam ms={row.other} share={1} shown={seen} delay={i * 120} />
							</div>
							<p className="flex items-baseline gap-2 md:flex-col md:items-end md:gap-0">
								<span className="text-[2.75rem] leading-none font-extralight tracking-[-0.05em] tabular-nums">
									{row.faster}%
								</span>
								<span className="font-mono text-[0.71875rem] text-muted-foreground">faster</span>
							</p>
						</li>
					))}
					{/* The miss, published alongside. */}
					<li className="grid items-center gap-x-10 gap-y-2 border-b border-white/8 py-7 text-muted-foreground md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_9rem]">
						<div>
							<p className="flex items-center gap-2 text-[1.125rem] font-medium tracking-[-0.015em] text-foreground/80">
								<TriangleAlert className="size-4 text-warning-foreground" />
								Boids
							</p>
							<p className="mt-1 font-mono text-[0.71875rem]">vs Unity DOTS</p>
						</div>
						<p className="text-[0.9375rem]">Ara is behind here, and the gap is published with the rest.</p>
						<p className="flex items-baseline gap-2 md:flex-col md:items-end md:gap-0">
							<span className="text-[1.75rem] leading-none font-extralight tracking-[-0.04em]">3.5–28%</span>
							<span className="font-mono text-[0.71875rem]">slower</span>
						</p>
					</li>
				</ul>
				<p className="mt-4 text-[0.8125rem] text-muted-foreground">
					Unity 6 IL2CPP + Burst and ozz-animation, on the same machine, with bit-exact results.
				</p>

				<div className="mt-24 grid grid-cols-[minmax(0,1fr)] gap-12 md:mt-32 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
					<div>
						<h3 className={LABEL}>Performance bar · D26</h3>
						<p className="mt-5 text-[1.75rem] leading-tight font-semibold tracking-[-0.03em] text-balance">
							Every scene inside its budget.
						</p>
						<p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
							GPU time (p50) at 2560 × 1440 on an RTX 4070 SUPER, against UE5-class budgets per quality preset.
						</p>
						<dl className="mt-8 border-t border-white/12 text-[0.875rem]">
							{D26_EXTRA.map((row) => (
								<div key={row.label} className="flex items-baseline gap-3 border-b border-white/8 py-3">
									<dt className="mr-auto text-foreground/85">{row.label}</dt>
									<dd className="font-mono tabular-nums">{row.value}</dd>
									<dd className="w-16 text-right text-[0.75rem] text-muted-foreground">of {row.target}</dd>
								</div>
							))}
						</dl>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[34rem] border-collapse">
							<thead>
								<tr>
									<th className={cn(LABEL, "pb-4 text-left font-normal")}>Scene</th>
									{PRESETS.map((p) => (
										<th key={p.name} className="pb-4 pl-6 text-left font-normal">
											<span className="block text-[0.9375rem] text-foreground/90">{p.name}</span>
											<span className="font-mono text-[0.6875rem] text-muted-foreground">budget {p.budget} ms</span>
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{D26.map((row, r) => (
									<tr key={row.scene} className="border-t border-white/10">
										<td className="py-6 pr-4 text-[1.0625rem] font-medium">{row.scene}</td>
										{row.p50.map((ms, i) => (
											<td key={PRESETS[i].name} className="py-6 pl-6">
												<Meter ms={ms} budget={PRESETS[i].budget} shown={seen} delay={(r * 4 + i) * 60} />
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div className="mt-14 flex flex-wrap items-center gap-x-5 gap-y-3">
				<p className="mr-auto text-[0.875rem] text-muted-foreground">
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

/**
 * One timing as a bar that grows in once `shown`: Ara's is a beam of light, the
 * comparison's a hatched shadow. `share` is its length against the slower of the pair.
 */
function Beam({
	ms,
	share,
	shown,
	delay,
	lit = false,
}: {
	ms: number;
	share: number;
	shown: boolean;
	delay: number;
	lit?: boolean;
}) {
	return (
		<div className="flex items-center gap-3">
			<div className="h-2 flex-1">
				<div
					className={cn(
						"h-full transition-[width] duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
						lit
							? "bg-gradient-to-r from-white/60 to-white shadow-[0_0_18px_rgb(255_255_255/0.45)]"
							: "bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.3)_0_1.5px,transparent_1.5px_4px)]",
					)}
					style={{ width: shown ? `${share * 100}%` : "0%", transitionDelay: `${delay}ms` }}
				/>
			</div>
			<span
				className={cn(
					"w-11 text-right font-mono text-[0.75rem] tabular-nums",
					lit ? "text-foreground" : "text-muted-foreground",
				)}
			>
				{ms.toFixed(2)}
			</span>
		</div>
	);
}

/** A reading against its budget: the number, and a lit meter filling its share of the budget. */
function Meter({ ms, budget, shown, delay }: { ms: number; budget: number; shown: boolean; delay: number }) {
	const share = Math.min(1, ms / budget);
	return (
		<div title={`${ms.toFixed(2)} ms of a ${budget} ms budget (${Math.round(share * 100)}%)`}>
			<p className="flex items-baseline gap-1">
				<span className="text-[1.5rem] leading-none font-light tracking-[-0.03em] tabular-nums">{ms.toFixed(2)}</span>
				<span className="font-mono text-[0.6875rem] text-muted-foreground">ms</span>
			</p>
			<div className="relative mt-3 h-[3px] max-w-28 bg-white/10">
				<div
					className="h-full bg-white shadow-[0_0_10px_rgb(255_255_255/0.5)] transition-[width] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
					style={{ width: shown ? `${share * 100}%` : "0%", transitionDelay: `${delay}ms` }}
				/>
			</div>
		</div>
	);
}
