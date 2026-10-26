import { ArrowUpRight, Download, Github } from "lucide-react";
import { Nuqta } from "#/components/brand";
import { Button } from "#/components/ui/button";
import { ENGINE_VERSION, links } from "#/lib/site";
import { EditorDemo } from "./editor-demo";

export function Hero() {
	return (
		<section className="relative overflow-hidden">
			<div aria-hidden className="bg-viewport-grid absolute inset-x-0 top-0 h-[760px]" />
			<div className="relative mx-auto max-w-[1200px] px-5 pt-14 md:px-8 md:pt-24">
				<a
					href={links.releaseNotes}
					target="_blank"
					rel="noreferrer"
					className="inline-flex animate-rise items-center gap-2 rounded-full border border-separator-strong bg-muted py-1 pr-3 pl-2.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
				>
					<Nuqta />
					<span className="font-medium text-foreground">{ENGINE_VERSION}</span>
					The first public alpha, for Windows
					<ArrowUpRight className="size-3.5" />
				</a>
				<h1 className="mt-7 animate-rise text-[46px] leading-[0.98] font-semibold tracking-[-0.045em] [animation-delay:80ms] sm:text-[64px] lg:text-[80px]">
					An AI-native
					<br />
					game engine.
				</h1>
				<p className="mt-7 max-w-[600px] animate-rise text-[17px] leading-relaxed text-pretty text-muted-foreground [animation-delay:160ms] md:text-[19px]">
					Unreal-level fidelity with Unity-level ease. Every edit, from you, a C# script or an AI agent, is a typed
					command you can undo, so agents work in your project like a teammate.
				</p>
				<div className="mt-9 flex animate-rise flex-wrap items-center gap-3 [animation-delay:240ms]">
					<Button asChild size="lg" className="h-11 px-5 text-[14px]">
						<a href={links.hubInstaller}>
							<Download />
							Download Ara Hub
						</a>
					</Button>
					<Button asChild size="lg" variant="outline" className="h-11 px-5 text-[14px]">
						<a href={links.repo} target="_blank" rel="noreferrer">
							<Github />
							View on GitHub
						</a>
					</Button>
					<span className="w-full text-[12.5px] text-muted-foreground sm:ml-2 sm:w-auto">
						Windows 10/11 x64 · Vulkan 1.3 GPU
					</span>
				</div>
			</div>
			<div className="relative mx-auto mt-16 max-w-[1240px] animate-rise px-3 [animation-delay:360ms] md:mt-20 md:px-8">
				<EditorDemo />
			</div>
		</section>
	);
}
