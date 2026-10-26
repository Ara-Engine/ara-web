import { Ellipsis, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

type PanelProps = {
	title: ReactNode;
	icon?: LucideIcon;
	/** Replaces the default ⋯ menu glyph on the right of the header. */
	actions?: ReactNode;
	className?: string;
	bodyClassName?: string;
	children: ReactNode;
};

/**
 * An editor panel: the 28 px `panel-header` strip (icon, title, ⋯) over a `card`
 * body, with a lit top edge. Used for every product vignette so the site reads like the editor.
 */
export function Panel({ title, icon: Icon, actions, className, bodyClassName, children }: PanelProps) {
	return (
		<div
			className={cn(
				"relative flex flex-col overflow-hidden rounded-lg border bg-card shadow-[0_24px_80px_-32px_rgb(255_255_255/0.07)]",
				className,
			)}
		>
			<span
				aria-hidden
				className="pointer-events-none absolute inset-x-8 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
			/>
			<div className="flex h-7 shrink-0 items-center gap-1.5 border-b bg-panel-header px-2.5 text-[0.75rem] text-foreground/90">
				{Icon && <Icon className="size-3.5 text-muted-foreground" aria-hidden />}
				<span className="truncate">{title}</span>
				<span className="ml-auto flex items-center gap-2 text-muted-foreground">
					{actions ?? <Ellipsis className="size-3.5" aria-hidden />}
				</span>
			</div>
			<div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
		</div>
	);
}
