import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "#/lib/utils";

/** Copies `text` to the clipboard and shows a check for a moment. */
export function CopyButton({ text, className }: { text: string; className?: string }) {
	const [copied, setCopied] = useState(false);

	const copy = async () => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	const Icon = copied ? Check : Copy;
	return (
		<button
			type="button"
			onClick={copy}
			aria-label={copied ? "Copied" : "Copy to clipboard"}
			className={cn(
				"grid size-7 shrink-0 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-hover-surface hover:text-foreground",
				className,
			)}
		>
			<Icon className={cn("size-3.5", copied && "text-success-foreground")} />
		</button>
	);
}
