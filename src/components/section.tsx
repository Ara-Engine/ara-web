import type { ReactNode } from "react";
import { Nuqta } from "#/components/brand";
import type { SectionId } from "#/lib/site";
import { cn } from "#/lib/utils";

type SectionProps = {
	id: SectionId;
	kicker: string;
	title: ReactNode;
	lede?: ReactNode;
	className?: string;
	children: ReactNode;
};

/** A home page section: nuqta kicker, headline and lede over its content. */
export function Section({ id, kicker, title, lede, className, children }: SectionProps) {
	return (
		<section id={id} className={cn("mx-auto w-full max-w-[1200px] px-5 py-20 md:px-8 md:py-28", className)}>
			<header className="mb-10 max-w-[640px] md:mb-14">
				<p className="mb-4 flex items-center gap-2.5 text-[13px] font-medium text-muted-foreground">
					<Nuqta />
					{kicker}
				</p>
				<h2 className="text-[32px] leading-[1.08] font-semibold tracking-[-0.03em] text-balance md:text-[44px]">
					{title}
				</h2>
				{lede && <p className="mt-5 text-[17px] leading-relaxed text-pretty text-muted-foreground">{lede}</p>}
			</header>
			{children}
		</section>
	);
}

/** Links a number to the file it was measured in. */
export function SourceLink({ href, children = "Source" }: { href: string; children?: ReactNode }) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noreferrer"
			className="font-mono text-[11px] text-muted-foreground underline decoration-separator-strong underline-offset-4 transition-colors hover:text-foreground hover:decoration-muted-foreground"
		>
			{children} ↗
		</a>
	);
}
