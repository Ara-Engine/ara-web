import { type CSSProperties, useEffect, useRef, useState } from "react";
import { FACETS, WINDOW } from "#/components/brand";
import { useReducedMotion } from "#/lib/hooks";

/** Facet tones on dark, lit to shaded (same as the mark). */
const TONES = ["fill-foreground", "fill-foreground/88", "fill-foreground/62", "fill-foreground/48"] as const;

/** Where each facet assembles from (top left, top right, bottom left, bottom right). */
const DIRS = [
	[-1, -0.8],
	[1, -0.8],
	[-1, 0.8],
	[1, 0.8],
] as const;

/**
 * The opening, in ms from mount: the crystal assembles and its window ignites, it flies
 * into the header and lands, then the dark opens over `dawn` ms. The hero scene and copy
 * key off `land`.
 */
export const INTRO_BEATS = { ignite: 550, fly: 1250, land: 2050, dawn: 1400 } as const;

/** Set on <html> while the intro's crystal is in flight, so the header's crystal waits. */
const HIDE_HEADER_CRYSTAL = "intro";

/** The crystal is 96 px; its window sits at (27, 35) on the 64 grid. */
const SIZE = 96;

/** The dawn's lattice: rhombus cells in the hero screen's proportions. */
const CELL = { w: 46, h: 80 };
/** Fraction of the dawn one cell takes to open; the rest is the wave crossing the screen. */
const OPEN = 0.3;

type Point = { x: number; y: number };
/** A lattice cell of the dawn: its centre, and when (0–1 of the dawn) it starts to open. */
type Cell = Point & { at: number };

/** Tiles the screen with rhombus cells, each opening later the farther it is from `origin`. */
function latticeCells(width: number, height: number, origin: Point): Cell[] {
	const far = Math.hypot(Math.max(origin.x, width - origin.x), Math.max(origin.y, height - origin.y));
	const cells: Cell[] = [];
	for (let row = 0; (row - 1) * (CELL.h / 2) <= height; row++) {
		const y = row * (CELL.h / 2);
		for (let x = row % 2 ? CELL.w / 2 : 0; x - CELL.w / 2 <= width; x += CELL.w) {
			const distance = Math.hypot(x - origin.x, y - origin.y) / far;
			cells.push({ x, y, at: distance * (1 - OPEN - 0.1) + Math.random() * 0.1 });
		}
	}
	return cells;
}

const rhombus = (ctx: CanvasRenderingContext2D, { x, y }: Point, s: number) => {
	ctx.moveTo(x, y - (CELL.h / 2) * s);
	ctx.lineTo(x + (CELL.w / 2) * s, y);
	ctx.lineTo(x, y + (CELL.h / 2) * s);
	ctx.lineTo(x - (CELL.w / 2) * s, y);
	ctx.closePath();
};

/**
 * One frame of the dawn at `t` (0–1): every cell is a tile of the dark that shrinks to
 * its nuqta and vanishes, its edge catching the light as it goes.
 */
function drawDawn(ctx: CanvasRenderingContext2D, cells: Cell[], t: number, dark: string) {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.beginPath();
	const lit: [Cell, number][] = [];
	for (const cell of cells) {
		const p = Math.min(1, Math.max(0, (t - cell.at) / OPEN));
		if (p === 1) continue;
		// Slightly oversized while closed, so neighbouring tiles leave no seams.
		const s = (1 - p) ** 2 * 1.02;
		rhombus(ctx, cell, s);
		if (p > 0) lit.push([cell, p]);
	}
	ctx.fillStyle = dark;
	ctx.fill();

	ctx.strokeStyle = "#fff";
	ctx.lineWidth = 1.25;
	for (const [cell, p] of lit) {
		ctx.globalAlpha = Math.sin(Math.PI * Math.min(1, p * 1.6)) * 0.85;
		ctx.beginPath();
		rhombus(ctx, cell, (1 - p) ** 2 * 1.02);
		ctx.stroke();
	}
	ctx.globalAlpha = 1;
}

/**
 * The site's opening, over everything: the crystal assembles facet by facet in the
 * dark and light ignites in its window. It flies into the header and becomes the logo;
 * then the dark opens like a lattice, cell by cell, rippling out from the logo. Skipped
 * under reduced motion; a CSS failsafe clears the overlay even if scripts never run.
 */
export function HeroIntro() {
	const reduced = useReducedMotion();
	const [done, setDone] = useState(false);
	const crystal = useRef<HTMLDivElement>(null);
	const curtain = useRef<HTMLDivElement>(null);
	const canvas = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (reduced) return;
		const root = document.documentElement;
		root.dataset[HIDE_HEADER_CRYSTAL] = "on";
		let frame = 0;

		// Fly the crystal onto the header's crystal, measured when the flight starts.
		const fly = setTimeout(() => {
			const from = crystal.current?.getBoundingClientRect();
			const to = document.querySelector("[data-header-crystal]")?.getBoundingClientRect();
			if (!crystal.current || !from || !to) return;
			const dx = to.left + to.width / 2 - (from.left + from.width / 2);
			const dy = to.top + to.height / 2 - (from.top + from.height / 2);
			crystal.current.animate(
				[{ transform: "none" }, { transform: `translate(${dx}px, ${dy}px) scale(${to.width / from.width})` }],
				{ duration: INTRO_BEATS.land - INTRO_BEATS.fly, easing: "cubic-bezier(0.65, 0, 0.25, 1)", fill: "forwards" },
			);
		}, INTRO_BEATS.fly);

		// Landed: hand over to the header's crystal and open the dark from there.
		const land = setTimeout(() => {
			delete root.dataset[HIDE_HEADER_CRYSTAL];
			const ctx = canvas.current?.getContext("2d");
			if (!ctx) return setDone(true);
			const { innerWidth: width, innerHeight: height } = window;
			const dpr = Math.min(window.devicePixelRatio, 2);
			ctx.canvas.width = Math.round(width * dpr);
			ctx.canvas.height = Math.round(height * dpr);
			ctx.scale(dpr, dpr);

			const logo = document.querySelector("[data-header-crystal]")?.getBoundingClientRect();
			const origin = logo ? { x: logo.left + logo.width / 2, y: logo.top + logo.height / 2 } : { x: 0, y: 0 };
			const cells = latticeCells(width, height, origin);
			const dark = getComputedStyle(root).getPropertyValue("--background");
			const start = performance.now();
			const tick = (now: number) => {
				const t = (now - start) / INTRO_BEATS.dawn;
				drawDawn(ctx, cells, t, dark);
				if (t < 1) frame = requestAnimationFrame(tick);
				else setDone(true);
			};
			tick(start);
			// The canvas now holds the dark, so the curtain can go.
			curtain.current?.style.setProperty("visibility", "hidden");
		}, INTRO_BEATS.land);

		return () => {
			clearTimeout(fly);
			clearTimeout(land);
			cancelAnimationFrame(frame);
			delete root.dataset[HIDE_HEADER_CRYSTAL];
		};
	}, [reduced]);

	if (reduced || done) return null;

	return (
		<div aria-hidden className="intro-overlay pointer-events-none fixed inset-0 z-[70] grid place-items-center">
			{/* The dark the page waits in, until the dawn's canvas takes it over. */}
			<div ref={curtain} className="absolute inset-0 bg-background" />
			<canvas ref={canvas} className="absolute inset-0 size-full" />

			{/* The crystal: assembles, ignites, then flies to the header. */}
			<div ref={crystal} className="relative" style={{ width: SIZE, height: SIZE }}>
				<svg aria-hidden="true" viewBox="0 0 64 64" className="size-full overflow-visible">
					<mask id="hero-intro-window">
						<rect x="-20" y="-20" width="104" height="104" fill="white" />
						<polygon points={WINDOW} fill="black" />
					</mask>
					<g mask="url(#hero-intro-window)">
						{FACETS.map((points, i) => (
							<polygon
								key={points}
								points={points}
								className={`${TONES[i]} [transform-box:fill-box] [transform-origin:center]`}
								style={
									{
										"--dx": `${DIRS[i][0] * 10}px`,
										"--dy": `${DIRS[i][1] * 10}px`,
										animation: `facet-in 600ms cubic-bezier(0.16,1,0.3,1) ${100 + i * 70}ms both`,
									} as CSSProperties
								}
							/>
						))}
					</g>
				</svg>
				{/* The light in the window: it ignites, then dims as the crystal lands. */}
				<span
					className="absolute size-[11%] rotate-45 bg-white shadow-[0_0_24px_8px_rgb(255_255_255/0.85)]"
					style={{
						left: `${(27 / 64) * 100}%`,
						top: `${(35 / 64) * 100}%`,
						translate: "-50% -50%",
						animation: `window-ignite ${INTRO_BEATS.land - INTRO_BEATS.ignite}ms ease-out ${INTRO_BEATS.ignite}ms both`,
					}}
				/>
			</div>
		</div>
	);
}
