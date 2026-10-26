import { ArrowRight, Download, Github } from "lucide-react";
import { FacetButton } from "#/components/facet-button";
import { ENGINE_VERSION, links } from "#/lib/site";
import { HeroIntro, INTRO_BEATS } from "./hero-intro";
import { MashrabiyaLight } from "./mashrabiya";

/**
 * Full-bleed hero: live mashrabiya light behind the headline. It starts under the
 * transparent header (-mt-14) and fades into the page background at the bottom.
 * Opening (HeroIntro): the crystal assembles and lands in the header, the dark opens
 * cell by cell from the logo, the lattice lights up and the copy rises in.
 */
export function Hero() {
	// Each line of copy rises in turn, once the dawn has passed it.
	const rise = (step: number) => ({ animationDelay: `${INTRO_BEATS.land + 350 + step * 120}ms` });

	return (
		<section className="relative -mt-14 flex min-h-[40rem] items-center overflow-hidden bg-background md:h-svh md:min-h-[45rem]">
			<MashrabiyaLight className="absolute inset-0 size-full" />
			<HeroIntro />
			{/* Keep the copy legible where the light pattern reaches it, and blend into the page. */}
			<div
				aria-hidden
				className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,color-mix(in_srgb,var(--background)_75%,transparent)_55%,color-mix(in_srgb,var(--background)_40%,transparent)_100%)] md:bg-[linear-gradient(90deg,color-mix(in_srgb,var(--background)_85%,transparent)_0%,color-mix(in_srgb,var(--background)_60%,transparent)_35%,transparent_62%)]"
			/>
			{/* Keeps the transparent header legible over the lit wall. */}
			<div aria-hidden className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/80 to-transparent" />
			<div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

			<div className="relative mx-auto w-full max-w-content px-5 pt-28 pb-20 md:px-8">
				<a
					href={links.releaseNotes}
					target="_blank"
					rel="noreferrer"
					style={rise(0)}
					className="group inline-flex animate-rise items-center gap-3 text-[0.8125rem] whitespace-nowrap text-foreground/60 transition-colors hover:text-foreground"
				>
					<span className="font-mono text-[0.75rem] tracking-[0.14em] text-foreground uppercase">
						Ara {ENGINE_VERSION}
					</span>
					<span className="h-px w-8 bg-foreground/30 max-sm:hidden transition-all duration-300 group-hover:w-12 group-hover:bg-foreground/60" />
					<span>First public alpha, for Windows</span>
					<ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
				</a>
				<h1
					style={rise(1)}
					className="mt-7 animate-rise text-[3rem] leading-[0.96] font-semibold tracking-[-0.045em] text-balance [text-shadow:0_2px_40px_rgb(0_0_0/0.6)] sm:text-[4.25rem] lg:text-[5.5rem]"
				>
					An AI-native
					<br />
					game engine.
				</h1>
				<p
					style={rise(2)}
					className="mt-7 max-w-[32.5rem] animate-rise text-[1.0625rem] leading-relaxed text-pretty text-foreground/70 [text-shadow:0_1px_16px_rgb(0_0_0/0.9)] md:text-[1.1875rem]"
				>
					Unreal-level fidelity with Unity-level ease. Every edit, from you, a C# script or an AI agent, is a typed
					command you can undo, so agents work in your project like a teammate.
				</p>
				<div style={rise(3)} className="mt-9 flex animate-rise flex-wrap items-center gap-3">
					<FacetButton asChild size="lg">
						<a href={links.hubInstaller}>
							<Download />
							Download Ara Hub
						</a>
					</FacetButton>
					<FacetButton asChild size="lg" variant="glass">
						<a href={links.repo} target="_blank" rel="noreferrer">
							<Github />
							View on GitHub
						</a>
					</FacetButton>
					<span className="w-full text-[0.78125rem] text-foreground/60 [text-shadow:0_1px_10px_rgb(0_0_0)] sm:ml-2 sm:w-auto">
						Windows 10/11 x64 · Vulkan 1.3 GPU
					</span>
				</div>
			</div>
		</section>
	);
}
