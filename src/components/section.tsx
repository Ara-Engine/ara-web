import { type ReactNode, useRef } from "react";
import { Nuqta } from "#/components/brand";
import { useInView } from "#/lib/hooks";
import type { SectionId } from "#/lib/site";
import { cn } from "#/lib/utils";

type SectionProps = {
	id: SectionId;
	kicker: string;
	title: ReactNode;
	lede?: ReactNode;
	/** Which side the section's light falls from; alternate it down the page. */
	light?: "left" | "right";
	className?: string;
	children: ReactNode;
};

/**
 * A home page section: mono kicker, headline and lede over its content. Behind it,
 * the mashrabiya pattern catches a soft pool of light from one side; the content
 * rises in the first time it scrolls into view.
 */
export function Section({ id, kicker, title, lede, light = "right", className, children }: SectionProps) {
	const ref = useRef<HTMLDivElement>(null);
	const seen = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });

	return (
		<section
			id={id}
			className={cn("relative isolate mx-auto w-full max-w-content px-5 py-20 md:px-8 md:py-32", className)}
		>
			<SectionLight side={light} />
			<div
				ref={ref}
				className={cn(
					"motion-safe:transition-[opacity,translate] motion-safe:duration-1000 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]",
					seen ? "opacity-100" : "motion-safe:translate-y-8 motion-safe:opacity-0",
				)}
			>
				<header className="mb-10 max-w-[40rem] md:mb-14">
					<p className="mb-5 flex items-center gap-3 font-mono text-[0.75rem] tracking-[0.14em] text-muted-foreground uppercase">
						<Nuqta />
						{kicker}
					</p>
					<h2 className="text-[2.125rem] leading-[1.05] font-semibold tracking-[-0.035em] text-balance md:text-[3rem]">
						{title}
					</h2>
					{lede && <p className="mt-5 text-[1.0625rem] leading-relaxed text-pretty text-muted-foreground">{lede}</p>}
				</header>
				{children}
			</div>
		</section>
	);
}

/** Lattice-filtered light behind a section: a faint pattern, a glow and one shaft. */
function SectionLight({ side }: { side: "left" | "right" }) {
	const right = side === "right";
	return (
		<div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
			<div
				className={cn(
					"bg-lattice absolute -top-24 h-[38.75rem] w-[51.25rem] opacity-[0.06] [mask-image:radial-gradient(closest-side,black,transparent)]",
					right ? "-right-64" : "-left-64",
				)}
			/>
			<div
				className={cn(
					"absolute -top-40 h-[35rem] w-[42.5rem] bg-[radial-gradient(closest-side,rgb(255_255_255/0.045),transparent)]",
					right ? "-right-40" : "-left-40",
				)}
			/>
			<div
				className={cn(
					"absolute inset-x-0 top-0 h-[45rem] [mask-image:linear-gradient(to_bottom,black,transparent)]",
					right
						? "bg-[linear-gradient(118deg,transparent_52%,rgb(255_255_255/0.03)_58%,transparent_66%)]"
						: "bg-[linear-gradient(62deg,transparent_34%,rgb(255_255_255/0.03)_42%,transparent_48%)]",
				)}
			/>
		</div>
	);
}

/** Links a number to the file it was measured in. */
export function SourceLink({ href, children = "Source" }: { href: string; children?: ReactNode }) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noreferrer"
			className="font-mono text-[0.6875rem] text-muted-foreground underline decoration-separator-strong underline-offset-4 transition-colors hover:text-foreground hover:decoration-muted-foreground"
		>
			{children} ↗
		</a>
	);
}
