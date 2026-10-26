import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "#/lib/utils";

/**
 * The site's call-to-action button, cut like a crystal facet: chamfered corners, a lit
 * top edge, and a band of light that sweeps across on hover. `solid` is the primary
 * action (light on dark, like the black-and-white mark); `glass` sits beside it.
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
				solid: [
					"bg-foreground text-background hover:bg-white",
					"shadow-[inset_0_1px_0_rgb(255_255_255/0.9),inset_0_-1px_0_rgb(0_0_0/0.25)]",
					"after:via-white/80",
				],
				glass: [
					"bg-white/[0.06] text-foreground backdrop-blur-md hover:bg-white/[0.1]",
					"shadow-[inset_0_1px_0_rgb(255_255_255/0.14),inset_0_0_0_1px_rgb(255_255_255/0.07)]",
					"after:via-white/15",
				],
			},
			size: {
				sm: "clip-facet-sm h-8 px-3.5 text-[13px] [&_svg]:size-3.5",
				md: "clip-facet h-10 px-5 text-[13.5px]",
				lg: "clip-facet h-12 px-6 text-[14.5px]",
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
