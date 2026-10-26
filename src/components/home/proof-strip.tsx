import { SourceLink } from "#/components/section";
import { evidence } from "#/lib/site";

const STATS = [
	{
		value: "4.6",
		unit: "%",
		label: "Whole-image error against a 32,768-sample path-traced reference, in Sponza",
		href: evidence.fidelity,
	},
	{
		value: "1.09",
		unit: "billion",
		label: "Scanned triangles rendered in 4.6 ms at native 1440p with virtual geometry",
		href: evidence.virtualGeometry,
	},
	{
		value: "19",
		unit: "ms",
		label: "C# hot reload for a method-body edit (p50), with every entity's state kept",
		href: evidence.hotReload,
	},
	{
		value: "22/22",
		unit: "tasks",
		label: "Agent tasks in arabench passed by Claude Code, and by Codex",
		href: evidence.arabench,
	},
] as const;

/** Four headline numbers under the hero, each linked to where it was measured. */
export function ProofStrip() {
	return (
		<section aria-label="Measured results" className="mx-auto max-w-content px-5 pt-20 md:px-8 md:pt-28">
			<div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-4">
				{STATS.map((s) => (
					<div key={s.value} className="flex flex-col bg-background p-6">
						<p className="flex items-baseline gap-1.5">
							<span className="text-[2.5rem] leading-none font-semibold tracking-[-0.03em]">{s.value}</span>
							<span className="text-[0.9375rem] text-muted-foreground">{s.unit}</span>
						</p>
						<p className="mt-3 mb-5 text-[0.875rem] leading-snug text-pretty text-muted-foreground">{s.label}</p>
						<div className="mt-auto">
							<SourceLink href={s.href} />
						</div>
					</div>
				))}
			</div>
			<p className="mt-4 text-[0.78125rem] text-muted-foreground">
				Measured on a Ryzen 7 7800X3D and RTX 4070 SUPER under Windows 11, on a machine shared with other builds. Treat
				every number as an upper bound.
			</p>
		</section>
	);
}
