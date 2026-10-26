import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "#/lib/utils";

/**
 * The site's call-to-action button, cut like a crystal facet: chamfered corners and a
 * band of light that sweeps across on hover. `solid` is the primary action (light on
 * dark, like the black-and-white mark); `glass` sits beside it.
 */
const facetButton = cva(
	[
		"group/facet relative isolate inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden font-medium whitespace-nowrap",
		"transition-[background-color,color,transform] duration-300 active:translate-y-px",
		"outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
		"[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
		// The light sweep: a soft diagonal band parked off the left edge.
		"after:pointer-events-none after:absolute after:inset-y-0 after:-left-1/2 after:w-1/2 after:-skew-x-[20deg] after:bg-gradient-to-r after:from-transparent after:to-transparent",
		"after:-translate-x-full after:transition-transform after:duration-700 after:ease-out hover:after:translate-x-[400%]",
	],
	{
		variants: {
			variant: {
				solid: ["bg-foreground text-background hover:bg-white", "after:via-white/80"],
				// A dark pane in a lit, faceted frame: the button's own fill is the frame, seen
				// 1 px wide around the inner pane (`before:`), so the edge follows both cuts and
				// catches the light hardest on the top-left one.
				glass: [
					"text-foreground",
					"bg-[linear-gradient(150deg,rgb(255_255_255/0.55),rgb(255_255_255/0.12)_35%,rgb(255_255_255/0.07)_65%,rgb(255_255_255/0.28))]",
					"hover:bg-[linear-gradient(150deg,rgb(255_255_255/0.8),rgb(255_255_255/0.2)_35%,rgb(255_255_255/0.1)_65%,rgb(255_255_255/0.4))]",
					"before:absolute before:inset-px before:-z-10 before:clip-facet-inner before:bg-[rgb(12_12_12/0.78)] before:backdrop-blur-md",
					"before:transition-colors before:duration-300 hover:before:bg-[rgb(24_24_24/0.78)]",
					"after:via-white/15",
				],
			},
			size: {
				sm: "clip-facet-sm h-8 px-3.5 text-[0.8125rem] [&_svg]:size-3.5",
				md: "clip-facet h-10 px-5 text-[0.84375rem]",
				lg: "clip-facet h-12 px-6 text-[0.90625rem]",
			},
		},
		defaultVariants: { variant: "solid", size: "md" },
	},
);

type FacetButtonProps = ComponentProps<"button"> & VariantProps<typeof facetButton> & { asChild?: boolean };

export function FacetButton({ className, variant, size, asChild = false, ...props }: FacetButtonProps) {
	const Comp = asChild ? Slot.Root : "button";
	return <Comp className={cn(facetButton({ variant, size }), className)} {...props} />;
}
