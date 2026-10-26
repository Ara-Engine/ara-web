import { useRef } from "react";
import { SourceLink } from "#/components/section";
import { useCountUp, useInView } from "#/lib/hooks";
import { evidence } from "#/lib/site";

/** `value` counts up with `decimals` places; `after` and `unit` follow it. */
const STATS = [
	{
		kicker: "Fidelity",
		value: 4.6,
		decimals: 1,
		unit: "%",
		label: "Whole-image error against a 32,768-sample path-traced reference, in Sponza",
		href: evidence.fidelity,
	},
	{
		kicker: "Geometry",
		value: 1.09,
		decimals: 2,
		unit: "billion",
		label: "Scanned triangles rendered in 4.6 ms at native 1440p with virtual geometry",
		href: evidence.virtualGeometry,
	},
	{
		kicker: "Hot reload",
		value: 19,
		decimals: 0,
		unit: "ms",
		label: "C# reload for a method-body edit (p50), with every entity's state kept",
		href: evidence.hotReload,
	},
	{
		kicker: "Agents",
		value: 22,
		decimals: 0,
		after: "/22",
		unit: "tasks",
		label: "arabench tasks passed by Claude Code, and by Codex",
		href: evidence.arabench,
	},
] as const;

type Stat = (typeof STATS)[number];

/**
 * Four headline numbers under the hero, read off like instruments: huge, light,
 * counting up as they arrive, each linked to where it was measured.
 */
export function ProofStrip() {
	const ref = useRef<HTMLDivElement>(null);
	const seen = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });

	return (
		<section aria-label="Measured results" className="relative px-5 pt-16 md:px-8 md:pt-24">
			<div ref={ref} className="relative mx-auto max-w-content">
				{/* A lit edge along the top, brightest where the hero's light falls. */}
				<span
					aria-hidden
					className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/5 via-white/40 to-white/10"
				/>
				<div className="grid border-b border-white/10 sm:grid-cols-2 lg:grid-cols-4">
					{STATS.map((s, i) => (
						<Reading key={s.kicker} stat={s} active={seen} index={i} />
					))}
				</div>
				<p className="mt-5 max-w-[48rem] text-[0.8125rem] text-muted-foreground">
					Measured on a Ryzen 7 7800X3D and RTX 4070 SUPER under Windows 11, on a machine shared with other builds.
					Treat every number as an upper bound.
				</p>
			</div>
		</section>
	);
}

function Reading({ stat, active, index }: { stat: Stat; active: boolean; index: number }) {
	const value = useCountUp(stat.value, active, 1400 + index * 150);

	return (
		<div className="group relative flex flex-col border-white/10 px-1 py-10 sm:px-6 sm:[&:nth-child(even)]:border-l lg:border-l lg:first:border-l-0 lg:first:pl-1 max-sm:border-t max-sm:first:border-t-0">
			{/* The lattice's light comes up behind a reading on hover. */}
			<span
				aria-hidden
				className="bg-lattice-lit absolute inset-0 -z-10 opacity-0 transition-opacity duration-700 [mask-image:radial-gradient(ellipse_at_30%_0%,black,transparent_70%)] group-hover:opacity-[0.07]"
			/>
			<p className="font-mono text-[0.6875rem] tracking-[0.18em] text-muted-foreground uppercase">{stat.kicker}</p>
			<p className="mt-6 flex items-baseline gap-2">
				<span className="bg-gradient-to-b from-white to-white/45 bg-clip-text text-[4.25rem] leading-none font-extralight tracking-[-0.06em] text-transparent tabular-nums md:text-[5.25rem]">
					{value.toFixed(stat.decimals)}
					{"after" in stat && stat.after}
				</span>
				<span className="font-mono text-[0.8125rem] text-muted-foreground">{stat.unit}</span>
			</p>
			<p className="mt-5 mb-6 max-w-[17rem] text-[0.875rem] leading-snug text-pretty text-muted-foreground">
				{stat.label}
			</p>
			<div className="mt-auto">
				<SourceLink href={stat.href} />
			</div>
		</div>
	);
}
