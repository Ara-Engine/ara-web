import { type ComponentProps, useId } from "react";
import { cn } from "#/lib/utils";

/*
 * The Ara mark: the nuqta (the calligrapher's unit of measure) as a crystal in 3/4
 * view, with a nuqta-shaped window where the facets meet. Facets are separated by
 * cuts on internal edges only. Geometry: 64-unit grid, from design/logo-nuqta.html.
 */
export const FACETS = [
	"30.58 3.37 5.01 28.02 26.01 33.5", // top left, lit
	"33.06 3.02 28.44 33.52 58.94 27.97", // top right
	"5.35 30.59 30.44 60.16 25.96 35.97", // bottom left
	"28.4 35.97 33 60.82 58.78 30.44", // bottom right, shaded
] as const;

/** The nuqta-shaped window where the facets meet (centre 27, 35). */
export const WINDOW = "27 26 34 35 27 44 20 35";

/** Facet fills, lit to shaded. `mono` follows the text colour; `white` is for dark tiles. */
const TONES = {
	mono: ["fill-foreground", "fill-foreground/88", "fill-foreground/62", "fill-foreground/48"],
	white: ["fill-white", "fill-white/90", "fill-white/75", "fill-white/60"],
} as const;

type CrystalProps = ComponentProps<"svg"> & { tone?: keyof typeof TONES };

/**
 * The crystal mark on its own. With `lit`, only that facet (0–3: top left, top right,
 * bottom left, bottom right) catches the light and the rest fall into shadow.
 */
export function AraCrystal({ tone = "mono", lit, ...props }: CrystalProps & { lit?: number }) {
	const mask = useId();
	return (
		<svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
			<mask id={mask}>
				<rect width="64" height="64" fill="white" />
				<polygon points={WINDOW} fill="black" />
			</mask>
			<g mask={`url(#${mask})`}>
				{FACETS.map((points, i) => (
					<polygon
						key={points}
						points={points}
						className={lit === undefined ? TONES[tone][i] : i === lit ? "fill-foreground" : "fill-foreground/12"}
					/>
				))}
			</g>
		</svg>
	);
}

/**
 * The emblem: the crystal set in a ring, Unreal-style. For moments (footer, closing
 * call to action, icons); the bare crystal is the everyday mark.
 */
export function AraEmblem({ tone = "mono", ...props }: CrystalProps) {
	const mask = useId();
	return (
		<svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
			<circle cx="32" cy="32" r="30" fill="none" strokeWidth="2.5" className="stroke-current" />
			<mask id={mask}>
				<rect width="64" height="64" fill="white" />
				<polygon points={WINDOW} fill="black" />
			</mask>
			<g mask={`url(#${mask})`} transform="translate(13.4 13.6) scale(0.58)">
				{FACETS.map((points, i) => (
					<polygon key={points} points={points} className={TONES[tone][i]} />
				))}
			</g>
		</svg>
	);
}

/**
 * Crystal plus the "Ara" name, for the header and footer. The header's copy is the
 * `landing` mark: the intro's crystal flies onto it (see HeroIntro).
 */
export function AraLogo({ className, landing = false }: { className?: string; landing?: boolean }) {
	return (
		<span className={cn("flex items-center gap-2 text-[1.1875rem] font-semibold tracking-[-0.04em]", className)}>
			<AraCrystal className="size-[1.3em] transition-opacity duration-150" data-header-crystal={landing || undefined} />
			Ara
		</span>
	);
}

/**
 * The nuqta on its own, flat: the site's bullet and section marker.
 */
export function Nuqta({ className }: { className?: string }) {
	return (
		<span
			aria-hidden
			className={cn("inline-block size-[0.4375rem] shrink-0 rotate-45 rounded-[1px] bg-primary", className)}
		/>
	);
}
