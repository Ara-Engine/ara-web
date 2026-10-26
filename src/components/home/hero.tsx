import { ArrowRight, Download, Github } from "lucide-react";
import { Button } from "#/components/ui/button";
import { ENGINE_VERSION, links } from "#/lib/site";
import { MashrabiyaLight } from "./mashrabiya";

/**
 * Full-bleed hero: live mashrabiya light behind the headline. It starts under the
 * transparent header (-mt-14) and fades into the page background at the bottom.
 * The copy rises in as the shader's intro brings the light up.
 */
export function Hero() {
	return (
		<section className="relative -mt-14 flex min-h-[640px] items-center overflow-hidden bg-background md:h-[92svh] md:max-h-[920px]">
			<MashrabiyaLight className="absolute inset-0 size-full" />
			{/* Keep the copy legible where the light pattern reaches it, and blend into the page. */}
			<div
				aria-hidden
				className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,color-mix(in_srgb,var(--background)_75%,transparent)_55%,color-mix(in_srgb,var(--background)_40%,transparent)_100%)] md:bg-[linear-gradient(90deg,color-mix(in_srgb,var(--background)_70%,transparent)_0%,transparent_55%)]"
			/>
			{/* Keeps the transparent header legible over the lit wall. */}
			<div aria-hidden className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/80 to-transparent" />
			<div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

			<div className="relative mx-auto w-full max-w-[1200px] px-5 pt-28 pb-20 md:px-8">
				<a
					href={links.releaseNotes}
					target="_blank"
					rel="noreferrer"
					className="group inline-flex animate-rise items-center gap-3 text-[13px] whitespace-nowrap text-foreground/60 transition-colors [animation-delay:500ms] hover:text-foreground"
				>
					<span className="font-mono text-[12px] tracking-[0.14em] text-foreground uppercase">
						Ara {ENGINE_VERSION}
					</span>
					<span className="h-px w-8 bg-foreground/30 transition-all duration-300 group-hover:w-12 group-hover:bg-foreground/60" />
					<span>First public alpha, for Windows</span>
					<ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
				</a>
				<h1 className="mt-7 animate-rise text-[48px] leading-[0.96] font-semibold tracking-[-0.045em] text-balance [animation-delay:650ms] [text-shadow:0_2px_40px_rgb(0_0_0/0.6)] sm:text-[68px] lg:text-[88px]">
					An AI-native
					<br />
					game engine.
				</h1>
				<p className="mt-7 max-w-[520px] animate-rise text-[17px] leading-relaxed text-pretty text-foreground/70 [animation-delay:800ms] md:text-[19px]">
					Unreal-level fidelity with Unity-level ease. Every edit, from you, a C# script or an AI agent, is a typed
					command you can undo, so agents work in your project like a teammate.
				</p>
				<div className="mt-9 flex animate-rise flex-wrap items-center gap-3 [animation-delay:950ms]">
					<Button asChild size="lg" className="h-11 px-5 text-[14px]">
						<a href={links.hubInstaller}>
							<Download />
							Download Ara Hub
						</a>
					</Button>
					<Button
						asChild
						size="lg"
						variant="outline"
						className="h-11 border-white/12 bg-white/5 px-5 text-[14px] backdrop-blur-md hover:bg-white/10"
					>
						<a href={links.repo} target="_blank" rel="noreferrer">
							<Github />
							View on GitHub
						</a>
					</Button>
					<span className="w-full text-[12.5px] text-foreground/55 sm:ml-2 sm:w-auto">
						Windows 10/11 x64 · Vulkan 1.3 GPU
					</span>
				</div>
			</div>
		</section>
	);
}
