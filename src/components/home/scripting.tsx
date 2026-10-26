import { CircleCheck, DoorOpen, FileCode, Gauge, SlidersHorizontal } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Panel } from "#/components/panel";
import { Section, SourceLink } from "#/components/section";
import { type TokenKind, tokenizeCSharp } from "#/lib/csharp";
import { useInView, useReducedMotion } from "#/lib/hooks";
import { evidence } from "#/lib/site";
import { cn } from "#/lib/utils";

/** The engine's Outpost sample Door.cs, lightly trimmed. `speed` is the live-edited literal. */
const doorSource = (speed: string) => `namespace Outpost;

/// <summary>A door that swings open around its Y axis when IsOpen is set.</summary>
public sealed partial class Door : Behaviour
{
    /// <summary>How far the door opens.</summary>
    [Property, Unit(Units.Degrees), Range(0, 180)]
    public partial float OpenAngle { get; set; }

    /// <summary>Whether the door should be open.</summary>
    [Property, Replicate] public partial bool IsOpen { get; set; }

    [Transient] float _degreesPerSecond;

    protected override void OnSpawn() => _degreesPerSecond = ${speed};

    protected override void OnTick(in Tick t)
    {
        ref var tr = ref Get<Transform>();
        var target = IsOpen ? OpenAngle : 0f;
        var step = _degreesPerSecond * t.Dt;
        tr.Rotation.Y = MathF.Abs(target - tr.Rotation.Y) <= step
            ? target
            : tr.Rotation.Y + MathF.Sign(target - tr.Rotation.Y) * step;
    }
}`;

const TOKEN_CLASS: Record<TokenKind, string> = {
	plain: "text-code-foreground/90",
	keyword: "text-chart-4",
	type: "text-chart-2",
	method: "text-info-foreground",
	string: "text-chart-3",
	number: "text-chart-3",
	comment: "text-muted-foreground",
};

const RELOAD_TIMINGS = [
	{ label: "Method-body edit", value: "19 ms", hint: "p50" },
	{ label: "Additive edit", value: "35–41 ms", hint: "new members" },
	{ label: "Module swap", value: "≈285 ms", hint: "whole assembly" },
	{ label: "Rust ↔ C# call", value: "3.5 ns", hint: "NativeAOT" },
] as const;

/** Plays one hot-reload edit (90f → 140f) the first time the code scrolls into view. */
function useLiveEdit() {
	const ref = useRef<HTMLDivElement>(null);
	const seen = useInView(ref, { once: true, margin: "-120px" });
	const reduced = useReducedMotion();
	const [step, setStep] = useState<"idle" | "edited" | "reloaded">("idle");

	useEffect(() => {
		if (!seen) return;
		if (reduced) {
			setStep("reloaded");
			return;
		}
		const edit = setTimeout(() => setStep("edited"), 900);
		const reload = setTimeout(() => setStep("reloaded"), 1500);
		return () => {
			clearTimeout(edit);
			clearTimeout(reload);
		};
	}, [seen, reduced]);

	return { ref, step };
}

export function Scripting() {
	const { ref, step } = useLiveEdit();
	const edited = step !== "idle";
	const lines = doorSource(edited ? "140f" : "90f").split("\n");
	const editedLine = lines.findIndex((l) => l.includes("OnSpawn"));

	return (
		<Section
			id="scripting"
			kicker="Scripting"
			title="C# 14, reloaded before you look up."
			lede="Gameplay is plain C# on .NET 10, hosted inside the engine process. Edit a method and it's live in about 19 ms with every entity's state intact; ship it with NativeAOT."
		>
			<div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
				<div ref={ref} className="relative">
					<Panel title="Door.cs" icon={FileCode} actions={<span className="text-[11px]">Outpost.Sample</span>}>
						<pre className="overflow-x-auto py-3 font-mono text-[12px] leading-[1.65] [font-variant-ligatures:none]">
							{lines.map((line, i) => (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: lines are positional
									key={i}
									className={cn(
										"flex pr-4 transition-colors duration-500",
										i === editedLine && edited && "bg-primary/12 shadow-[inset_2px_0_0_var(--primary)]",
									)}
								>
									<span className="w-11 shrink-0 pr-4 text-right text-muted-foreground/60 select-none">{i + 1}</span>
									<code>
										{tokenizeCSharp(line).map((t, j) => (
											// biome-ignore lint/suspicious/noArrayIndexKey: tokens are positional
											<span key={j} className={TOKEN_CLASS[t.kind]}>
												{t.text}
											</span>
										))}
									</code>
								</div>
							))}
						</pre>
					</Panel>
					<div
						className={cn(
							"absolute right-4 bottom-4 flex items-center gap-2.5 rounded-md border border-separator-strong bg-menu-surface px-3 py-2 text-[12.5px] shadow-xl transition-all duration-500",
							step === "reloaded" ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
						)}
					>
						<CircleCheck className="size-4 text-success-foreground" />
						<span>Reloaded Outpost.Sample</span>
						<span className="font-mono text-[11.5px] text-muted-foreground">19 ms · state kept</span>
					</div>
				</div>

				<div className="flex flex-col gap-4">
					<Panel title="Inspector" icon={SlidersHorizontal}>
						<div className="px-3 py-2.5 text-[12.5px]">
							<div className="mb-2 flex items-center gap-1.5 text-foreground">
								<DoorOpen className="size-3.5 text-muted-foreground" />
								Door
								<span className="ml-auto text-[11px] text-muted-foreground">generated from Door.cs</span>
							</div>
							<InspectorField label="Open angle" doc="How far the door opens.">
								<span className="relative h-1 flex-1 rounded-full bg-raised">
									<span className="absolute inset-y-0 left-0 w-[61%] rounded-full bg-primary" />
									<span className="absolute top-1/2 left-[61%] size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-foreground" />
								</span>
								<span className="w-14 rounded-xs bg-muted px-1.5 py-0.5 text-right font-mono text-[11.5px] tabular-nums">
									110 °
								</span>
							</InspectorField>
							<InspectorField label="Is open" doc="Whether the door should be open. Replicated.">
								<span className="grid size-4 place-items-center rounded-[4px] bg-primary text-[10px] text-primary-foreground">
									✓
								</span>
							</InspectorField>
						</div>
					</Panel>

					<Panel title="Hot reload" icon={Gauge}>
						<dl className="divide-y text-[13px]">
							{RELOAD_TIMINGS.map((r) => (
								<div key={r.label} className="flex items-baseline justify-between px-3.5 py-2.5">
									<dt className="text-foreground/90">
										{r.label} <span className="ml-1 text-[11.5px] text-muted-foreground">{r.hint}</span>
									</dt>
									<dd className="font-mono text-[13.5px] tabular-nums">{r.value}</dd>
								</div>
							))}
						</dl>
					</Panel>
					<div className="flex gap-4">
						<SourceLink href={evidence.hotReload}>Timings</SourceLink>
						<SourceLink href={evidence.doorSample}>Door.cs</SourceLink>
					</div>
				</div>
			</div>
		</Section>
	);
}

/** An inspector row whose help text is the property's doc comment, as in the editor. */
function InspectorField({ label, doc, children }: { label: string; doc: string; children: ReactNode }) {
	return (
		<div className="border-t py-2.5">
			<div className="flex items-center gap-3">
				<span className="w-20 shrink-0 text-foreground/85">{label}</span>
				<span className="flex flex-1 items-center gap-3">{children}</span>
			</div>
			<p className="mt-1 text-[11.5px] text-muted-foreground">{doc}</p>
		</div>
	);
}
