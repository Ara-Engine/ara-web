import { Download, Github } from "lucide-react";
import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import { FacetButton } from "#/components/facet-button";
import { FloorLight } from "#/components/section";
import { useInView } from "#/lib/hooks";
import { links } from "#/lib/site";

/** The window, in lattice units: cells are 28 × 48 rhombi on a staggered grid. */
const W = 392;
const H = 520;
const CELL = { w: 28, h: 48 };

/** Its outline: upright sides rising into a pointed arch. */
const ARCH = `M0 ${H}V170C0 80 ${W / 2 - 50} 30 ${W / 2} 0C${W / 2 + 50} 30 ${W} 80 ${W} 170V${H}Z`;

/** Where the sun sits behind the screen: openings near it burn brightest. */
const SUN = { x: W * 0.5, y: H * 0.38 };

/** Stable per-cell noise, so server and client agree on every delay. */
const noise = (n: number) => {
	const x = Math.sin(n * 12.9898) * 43758.5453;
	return x - Math.floor(x);
};

/** A rhombus path around (x, y) with half-extents (hw, hh). */
const rhombus = (x: number, y: number, hw: number, hh: number) =>
	`M${x} ${y - hh}L${x + hw} ${y}L${x} ${y + hh}L${x - hw} ${y}Z`;

/**
 * Every opening: a lit rhombus with its nuqta cut out. It ignites outward from the
 * sun and settles at `glow`, dimmer the farther it is from it.
 */
const CELLS = Array.from({ length: Math.ceil((2 * H) / CELL.h) + 1 }, (_, row) =>
	Array.from({ length: Math.ceil(W / CELL.w) + 1 }, (_, col) => {
		const x = col * CELL.w + (row % 2 ? CELL.w / 2 : 0);
		const y = (row * CELL.h) / 2;
		const reach = Math.hypot((x - SUN.x) / W, (y - SUN.y) / H);
		return {
			key: `${row}-${col}`,
			d: rhombus(x, y, CELL.w * 0.39, CELL.h * 0.39) + rhombus(x, y, 2.1, 3.6),
			delay: Math.round(reach * 1500 + noise(row * 97 + col) * 450),
			glow: Math.max(0.22, 1 - reach * 1.25).toFixed(2),
		};
	}),
).flat();

/**
 * The page's last word: a mashrabiya window whose openings ignite one by one as it
 * comes into view, its light falling to the floor where the call to action stands.
 */
export function Finale() {
	const ref = useRef<HTMLDivElement>(null);
	const seen = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
	// Until hydration the window shows lit (no-JS readers see it whole); then it waits dark.
	const [armed, setArmed] = useState(false);
	useEffect(() => setArmed(true), []);
	const clip = useId();

	return (
		<section
			aria-labelledby="finale-title"
			className="relative isolate overflow-hidden px-5 pt-10 pb-32 md:px-8 md:pb-44"
		>
			<div ref={ref} className="relative mx-auto w-[min(23rem,72vw)]">
				<div
					aria-hidden
					className="absolute -inset-[25%] -z-10 bg-[radial-gradient(closest-side,rgb(255_255_255/0.16),transparent)] transition-opacity delay-500 duration-[2000ms]"
					style={{ opacity: armed && !seen ? 0 : 1 }}
				/>
				<svg
					aria-hidden="true"
					viewBox={`0 0 ${W} ${H}`}
					className="w-full overflow-visible drop-shadow-[0_0_14px_rgb(255_255_255/0.45)]"
				>
					<clipPath id={clip}>
						<path d={ARCH} />
					</clipPath>
					<g clipPath={`url(#${clip})`}>
						{CELLS.map((c) => (
							<path
								key={c.key}
								d={c.d}
								fill="white"
								fillRule="evenodd"
								style={
									seen
										? ({
												"--glow": c.glow,
												animation: `cell-ignite 1300ms ease-out ${c.delay}ms both`,
											} as CSSProperties)
										: { opacity: armed ? 0 : c.glow }
								}
							/>
						))}
					</g>
					<path d={ARCH} fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="2" />
				</svg>
				{/* The light falling from the window to the floor. */}
				<div
					aria-hidden
					className="absolute top-[96%] left-1/2 -z-10 h-[30rem] w-[320%] -translate-x-1/2 bg-[radial-gradient(ellipse_32%_100%_at_50%_0%,rgb(255_255_255/0.1),transparent)] blur-xl transition-opacity delay-700 duration-[2000ms]"
					style={{ opacity: armed && !seen ? 0 : 1 }}
				/>
			</div>
			<FloorLight className="inset-x-0 bottom-0 h-[26rem]" />

			<div className="relative mx-auto mt-20 max-w-content text-center md:mt-28">
				<h2
					id="finale-title"
					className="text-[3rem] leading-[0.96] font-semibold tracking-[-0.045em] text-balance md:text-[5.5rem]"
				>
					Make something with Ara.
				</h2>
				<p className="mx-auto mt-6 max-w-[30rem] text-[1.0625rem] text-foreground/60 md:text-[1.1875rem]">
					It's an early alpha for testers and agents. Tell us what breaks.
				</p>
				<div className="mt-10 flex flex-wrap justify-center gap-3">
					<FacetButton asChild size="lg">
						<a href={links.hubInstaller}>
							<Download />
							Download Ara Hub
						</a>
					</FacetButton>
					<FacetButton asChild size="lg" variant="glass">
						<a href={`${links.repo}/issues`} target="_blank" rel="noreferrer">
							<Github />
							Report an issue
						</a>
					</FacetButton>
				</div>
			</div>
		</section>
	);
}
