import { type ReactNode, useRef } from "react";
import { Nuqta } from "#/components/brand";
import { useInView } from "#/lib/hooks";
import type { SectionId } from "#/lib/site";
import { cn } from "#/lib/utils";

type SectionProps = {
	id: SectionId;
	/** The chapter number, "01" and on. */
	index: string;
	kicker: string;
	/** The headline; wrap its second half in `text-foreground/35` to step it back. */
	title: ReactNode;
	lede?: ReactNode;
	className?: string;
	children: ReactNode;
};

/**
 * A chapter of the home page. A rule runs across the page with the chapter number
 * and name, and a light sweeps along it as the chapter arrives; under it the headline
 * at near-hero scale, its lede set off to the right. Light from the hero's lattice
 * hangs in the air behind it all.
 */
export function Section({ id, index, kicker, title, lede, className, children }: SectionProps) {
	const ref = useRef<HTMLDivElement>(null);
	const seen = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });

	return (
		<section id={id} className={cn("relative isolate overflow-x-clip px-5 py-24 md:px-8 md:py-40", className)}>
			<SectionLight />
			<div ref={ref} className="mx-auto max-w-content">
				<header className="mb-14 md:mb-20">
					<div className="flex items-center gap-4 font-mono text-[0.75rem] tracking-[0.18em] uppercase">
						<span className="text-foreground">{index}</span>
						<span className="relative h-px flex-1 overflow-hidden bg-white/12">
							<span
								className={cn(
									"absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white to-transparent opacity-0",
									seen && "opacity-100 motion-safe:animate-[rule-sweep_1.8s_cubic-bezier(0.4,0,0.2,1)_both]",
								)}
							/>
						</span>
						<span className="flex items-center gap-2.5 text-muted-foreground">
							<Nuqta />
							{kicker}
						</span>
					</div>
					<div
						className={cn(
							"mt-10 grid gap-6 md:mt-14 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:items-end lg:gap-12",
							"motion-safe:transition-[opacity,translate] motion-safe:duration-1000 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]",
							seen ? "opacity-100" : "motion-safe:translate-y-6 motion-safe:opacity-0",
						)}
					>
						<h2 className="text-[2.75rem] leading-[0.96] font-semibold tracking-[-0.045em] text-balance md:text-[4.25rem] xl:text-[5rem]">
							{title}
						</h2>
						{lede && (
							<p className="max-w-[28rem] text-[1.0625rem] leading-relaxed text-pretty text-foreground/60 md:text-[1.125rem]">
								{lede}
							</p>
						)}
					</div>
				</header>
				<div
					className={cn(
						"motion-safe:transition-[opacity,translate] motion-safe:delay-150 motion-safe:duration-1000 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]",
						seen ? "opacity-100" : "motion-safe:translate-y-10 motion-safe:opacity-0",
					)}
				>
					{children}
				</div>
			</div>
		</section>
	);
}

/** The hero's light carried down the page: a wide shaft from the upper right, lattice-filtered. */
function SectionLight() {
	return (
		<div
			aria-hidden
			className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_22%,black_70%,transparent)]"
		>
			<div className="absolute -top-[10%] right-[-20%] h-[130%] w-[70%] origin-top-right rotate-[28deg] bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.035)_35%,rgb(255_255_255/0.05)_50%,rgb(255_255_255/0.035)_65%,transparent)] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]">
				<div className="bg-lattice-lit absolute inset-0 opacity-[0.05] [mask-image:linear-gradient(90deg,transparent,black_40%,black_60%,transparent)]" />
			</div>
		</div>
	);
}

/**
 * The lattice's light on the floor, as in the hero: the lit pattern laid back in
 * perspective, brightest in the middle. Put it behind a showpiece so it stands in the light.
 */
export function FloorLight({ className }: { className?: string }) {
	return (
		<div aria-hidden className={cn("pointer-events-none absolute -z-10 [perspective:60rem]", className)}>
			<div className="bg-lattice-lit size-full origin-bottom [transform:rotateX(64deg)] opacity-30 [mask-image:radial-gradient(closest-side,black_15%,transparent)]" />
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
