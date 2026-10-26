import type { ComponentProps } from "react";
import { cn } from "#/lib/utils";

/**
 * The Ara mark: a reed-pen "A" with a rhombic nuqta for a crossbar
 * (engine docs/design/brand.md). Geometry is the 64-unit master grid.
 */
const MARK_PATHS = (
	<>
		<path d="M32 4 L60 60 H44 L28 28 L12 60 H4 Z" />
		<path d="M28 44 L34 50 L28 56 L22 50 Z" />
	</>
);

/** The mark alone, in the accent colour. */
export function AraMark(props: ComponentProps<"svg">) {
	return (
		<svg viewBox="0 0 64 64" className="fill-primary" aria-hidden="true" {...props}>
			{MARK_PATHS}
		</svg>
	);
}

/** Mark plus "ra" letterforms, as in the engine's ara-wordmark.svg. */
export function AraWordmark(props: ComponentProps<"svg">) {
	return (
		<svg viewBox="0 0 136 64" role="img" aria-label="Ara" {...props}>
			<g className="fill-primary">{MARK_PATHS}</g>
			<g className="fill-foreground">
				<path d="M66 60 V42 A18 18 0 0 1 90.74 25.31 L87.37 33.66 A9 9 0 0 0 75 42 V60 Z" />
				<path d="M96 42 A18 18 0 0 1 132 42 A18 18 0 0 1 96 42 Z M105 42 A9 9 0 0 0 123 42 A9 9 0 0 0 105 42 Z M123 24 H132 V60 H123 Z" />
			</g>
		</svg>
	);
}

/**
 * The nuqta on its own: the calligrapher's unit of measure, used as the
 * site's bullet and section marker.
 */
export function Nuqta({ className }: { className?: string }) {
	return (
		<span
			aria-hidden
			className={cn("inline-block size-[7px] shrink-0 rotate-45 rounded-[1px] bg-primary", className)}
		/>
	);
}
