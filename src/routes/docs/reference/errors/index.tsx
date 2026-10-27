import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { DocsPage } from "#/components/docs/docs-page";
import { docsHead, docsIndex } from "#/lib/docs";

export const Route = createFileRoute("/docs/reference/errors/")({
	component: ErrorsIndex,
	head: () => docsHead("Diagnostic codes", "Every stable Ara diagnostic code, with its causes and fixes."),
});

/** Every diagnostic code in one filterable table. */
function ErrorsIndex() {
	const [query, setQuery] = useState("");
	const q = useDeferredValue(query.trim().toLowerCase());
	const rows = q ? docsIndex.errors.filter((e) => `${e.code} ${e.title}`.toLowerCase().includes(q)) : docsIndex.errors;

	return (
		<DocsPage
			kicker="Reference · Diagnostics"
			title="Diagnostic codes"
			lead={
				<>
					Every problem the engine reports has a stable code. Each page lists common causes and fixes; in a project,{" "}
					<code>ara why ARA1302</code> explains one against your own files.
				</>
			}
		>
			<label className="mb-6 flex items-center gap-2.5 border border-white/12 px-3 py-2 focus-within:border-white/40">
				<Search className="size-4 text-muted-foreground" />
				<input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder={`Filter ${docsIndex.errors.length} codes…`}
					className="flex-1 bg-transparent text-[0.9375rem] outline-none placeholder:text-muted-foreground"
				/>
			</label>
			<ul className="border-t border-white/12">
				{rows.map((e) => (
					<li key={e.code} className="border-b border-white/8">
						<Link
							to="/docs/reference/errors/$code"
							params={{ code: e.code }}
							className="group grid gap-x-6 py-3 sm:grid-cols-[11rem_minmax(0,1fr)]"
						>
							<span className="font-mono text-[0.875rem] text-foreground">{e.code}</span>
							<span className="text-[0.9375rem] text-muted-foreground group-hover:text-foreground">{e.title}</span>
						</Link>
					</li>
				))}
			</ul>
			{rows.length === 0 && <p className="py-6 text-muted-foreground">No code matches “{query}”.</p>}
		</DocsPage>
	);
}
