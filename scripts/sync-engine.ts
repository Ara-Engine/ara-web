// Snapshots the installed engine's reference into src/content/engine/ for the docs site:
//
//   pnpm sync-engine            (newest engine under %LOCALAPPDATA%\Ara\Engines)
//   ARA_EXE=…\ara.exe pnpm sync-engine
//
// It runs the engine's own exports inside a clean `ara init` project (so no game's types
// leak in): `ara schema` (reflection.json), `ara docs --llms` (protocol methods,
// diagnostic codes, conventions), every `ara <command> --help`, and the C# API of
// Ara.Runtime (tools/csharp-api, needs the .NET SDK). The output is committed, so the
// site builds without the engine installed. Rerun after each engine release.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type {
	CliPage,
	CommandPage,
	CsharpKind,
	CsharpType,
	DocsIndex,
	FieldDoc,
	MarkdownPage,
	SchemaKind,
	TypePage,
} from "../src/lib/docs-data.ts";
import { highlight, type LinkRewriter, renderInline, renderMarkdown } from "./markdown.ts";

const OUT = resolve("src/content/engine");

// ---------- Run the engine ----------

function findEngine() {
	if (process.env.ARA_EXE) return { exe: process.env.ARA_EXE, root: resolve(process.env.ARA_EXE, "..") };
	const base = join(process.env.LOCALAPPDATA ?? "", "Ara", "Engines");
	const versions = existsSync(base)
		? readdirSync(base).sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
		: [];
	const root = versions.length ? join(base, versions[versions.length - 1]) : "";
	if (!root || !existsSync(join(root, "ara.exe"))) throw new Error(`No engine under ${base}; set ARA_EXE.`);
	return { exe: join(root, "ara.exe"), root };
}

const engine = findEngine();
const run = (args: string[], cwd?: string) =>
	execFileSync(engine.exe, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 << 20 });

const work = mkdtempSync(join(tmpdir(), "ara-sync-"));
const project = join(work, "proj");
run(["init", "proj"], work);
run(["schema", "--out", join(work, "schema")], project);
run(["docs", "--llms", "--out", join(work, "docs")], project);
const version = run(["--version"])
	.trim()
	.replace(/^ara\s+/, "");
const llms = readFileSync(join(work, "docs", "llms.txt"), "utf8");
const protocol = llms.match(/protocol (\S+?)\./)?.[1] ?? "";
console.log(`ara ${version} (${protocol}) at ${engine.root}`);

type Field = {
	type: string;
	doc: string;
	default?: unknown;
	unit?: string;
	range?: [number | null, number | null];
	options?: string[];
	required?: boolean;
	replicate?: { audience?: string; interpolate?: string; rollback?: boolean };
	editor?: { showIf?: { field: string; when: { oneOf?: unknown[] } } };
};
type SchemaType = {
	kind: SchemaKind;
	doc: string;
	module?: string;
	prefix?: string;
	fields?: Record<string, Field>;
	variants?: Record<string, { doc: string }>;
};
type Command = {
	summary: string;
	params?: string;
	scope: string;
	hints: { idempotent: boolean; destructive: boolean };
	examples?: unknown[];
};
type Reflection = {
	types: Record<string, SchemaType>;
	documents: Record<string, { doc: string; extension: string; idPrefix: string; records: string[] }>;
	commands: Record<string, Command>;
};
const reflection: Reflection = JSON.parse(readFileSync(join(work, "schema", "reflection.json"), "utf8"));

// ---------- Helpers ----------

/** The engine's relative Markdown links (`../types/Light.md`) as site URLs. */
const engineLink: LinkRewriter = (href) => {
	const page = href.match(/(?:^|\/)(types|commands|methods|errors)\/([^/#]+)\.md(#.*)?$/);
	if (page) return `/docs/reference/${page[1]}/${page[2]}${page[3] ?? ""}`;
	const top = href.match(/(?:^|\/)(conventions|scopes|errors)\.md(#.*)?$/);
	return top ? `/docs/reference/${top[1]}${top[2] ?? ""}` : href;
};

const plain = (md: string) => md.replace(/`([^`]*)`/g, "$1").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const typeNames = new Set(Object.keys(reflection.types));

/** A schema type string with every known type name linked. */
const typeHtml = (type: string) =>
	escapeHtml(type).replace(/\b[A-Z][A-Za-z0-9]*\b/g, (id) =>
		typeNames.has(id) ? `<a href="/docs/reference/types/${id}">${id}</a>` : id,
	);

const range = ([min, max]: [number | null, number | null]) =>
	min != null && max != null ? `${min} – ${max}` : min != null ? `≥ ${min}` : max != null ? `≤ ${max}` : undefined;

function field(name: string, f: Field): FieldDoc {
	const showIf = f.editor?.showIf;
	return {
		name,
		typeHtml: typeHtml(f.type),
		doc: renderInline(f.doc, engineLink),
		default: f.default === undefined || f.required ? undefined : JSON.stringify(f.default),
		unit: f.unit,
		range: f.range && range(f.range),
		options: f.options,
		required: f.required,
		replicate: f.replicate
			? [f.replicate.audience, f.replicate.interpolate, f.replicate.rollback && "rollback"].filter(Boolean).join(", ")
			: undefined,
		showIf: showIf ? `${showIf.field} is ${(showIf.when.oneOf ?? []).join(" or ")}` : undefined,
	};
}

const fields = (t?: SchemaType) => Object.entries(t?.fields ?? {}).map(([name, f]) => field(name, f));
const referencedTypes = (t: SchemaType) =>
	new Set(Object.values(t.fields ?? {}).flatMap((f) => f.type.match(/\b[A-Z][A-Za-z0-9]*\b/g) ?? []));

function write(dir: string, name: string, data: unknown) {
	mkdirSync(join(OUT, dir), { recursive: true });
	writeFileSync(join(OUT, dir, `${name}.json`), `${JSON.stringify(data)}\n`);
}

/** An engine Markdown page: its title line, first paragraph as summary, the rest as HTML. */
function markdownPage(source: string, name: string, titleOf: (h1: string) => string): MarkdownPage {
	const [, h1 = name, body = source] = source.match(/^#\s+(.*)\n([\s\S]*)$/) ?? [];
	const summary = body.trim().split(/\n\s*\n/)[0] ?? "";
	const { html, headings } = renderMarkdown(body, engineLink);
	return { name, title: titleOf(h1), summary: plain(summary.replace(/\n/g, " ")), html, headings };
}

rmSync(OUT, { recursive: true, force: true });

// ---------- C# API ----------

const runtime = join(engine.root, "dotnet", "artifacts", "bin", "Ara.Runtime", "release");
const csharpJson = join(work, "csharp.json");
execFileSync(
	"dotnet",
	[
		"run",
		"--project",
		"tools/csharp-api",
		"-c",
		"Release",
		"--",
		join(runtime, "Ara.Runtime.dll"),
		join(runtime, "Ara.Runtime.xml"),
		csharpJson,
	],
	{ stdio: ["ignore", "inherit", "inherit"] },
);
type RawMember = Omit<CsharpType["members"][number], "signature"> & { signature: string };
type RawType = Omit<CsharpType, "declaration" | "members" | "component"> & {
	declaration: string;
	members: RawMember[];
};
const rawCsharp: RawType[] = JSON.parse(readFileSync(csharpJson, "utf8")).types;
const md = (s?: string | null) => (s ? renderMarkdown(s).html : undefined);
/** C# structs that bind a schema component (scripts can `Get<T>()` these). */
const scriptable = new Set(
	rawCsharp.filter((t) => t.kind === "struct" && reflection.types[t.slug]?.kind === "component").map((t) => t.slug),
);

for (const t of rawCsharp) {
	const page: CsharpType = {
		...t,
		declaration: highlight(t.declaration, "csharp"),
		summary: md(t.summary),
		remarks: md(t.remarks),
		example: md(t.example),
		typeParams: t.typeParams.map((p) => ({ name: p.name, summary: md(p.summary) })),
		values: t.values.map((v) => ({ ...v, summary: md(v.summary) })),
		members: t.members.map((m) => ({
			...m,
			signature: highlight(m.signature, "csharp"),
			summary: md(m.summary),
			remarks: md(m.remarks),
			example: md(m.example),
			returns: md(m.returns),
			value: md(m.value),
			params: m.params.map((p) => ({ name: p.name, summary: md(p.summary) })),
			typeParams: m.typeParams.map((p) => ({ name: p.name, summary: md(p.summary) })),
		})),
		component: scriptable.has(t.slug) ? t.slug : undefined,
	};
	write("csharp", t.slug, page);
}

// ---------- Schema types ----------

const usedByTypes = new Map<string, Set<string>>();
for (const [name, t] of Object.entries(reflection.types))
	for (const ref of referencedTypes(t))
		if (ref !== name) usedByTypes.set(ref, (usedByTypes.get(ref) ?? new Set()).add(name));
const usedByCommands = new Map<string, Set<string>>();
for (const [name, c] of Object.entries(reflection.commands)) {
	const params = c.params ? reflection.types[c.params] : undefined;
	for (const ref of [c.params, ...(params ? referencedTypes(params) : [])])
		if (ref) usedByCommands.set(ref, (usedByCommands.get(ref) ?? new Set()).add(name));
}

function componentUsage(name: string, t: SchemaType): TypePage["usage"] {
	const [first, f] = Object.entries(t.fields ?? {}).find(([, f]) => f.default !== undefined && !f.required) ?? [];
	const sample =
		first && f ? JSON.stringify((f as Field & { examples?: unknown[] }).examples?.[0] ?? f.default) : undefined;
	const usage = [
		{
			label: "Add it",
			html: highlight(
				`ara do component.add -p entity=name:Crate -p component=${name} --why "Add ${name}"`,
				"powershell",
			),
		},
	];
	if (first && sample)
		usage.push({
			label: "Set a field",
			html: highlight(
				`ara do property.set -p entity=name:Crate -p path=${name}.${first} -p value=${sample} --why "Tune ${name}"`,
				"powershell",
			),
		});
	usage.push({
		label: "In a scene document",
		html: highlight(
			JSON.stringify({ [name]: first ? { [first]: JSON.parse(sample ?? "null") } : {} }, null, 2),
			"json",
		),
	});
	if (scriptable.has(name))
		usage.push({ label: "From C#", html: highlight(`ref var ${name.toLowerCase()} = ref Get<${name}>();`, "csharp") });
	return usage;
}

for (const [name, t] of Object.entries(reflection.types)) {
	const page: TypePage = {
		name,
		kind: t.kind,
		module: t.module,
		doc: renderInline(t.doc, engineLink),
		fields: fields(t),
		variants: Object.entries(t.variants ?? {}).map(([v, d]) => ({ name: v, doc: renderInline(d.doc, engineLink) })),
		prefix: t.prefix,
		usedBy: {
			types: [...(usedByTypes.get(name) ?? [])].sort(),
			commands: [...(usedByCommands.get(name) ?? [])].sort(),
		},
		usage: t.kind === "component" ? componentUsage(name, t) : undefined,
		csharp: scriptable.has(name) ? name : undefined,
	};
	write("types", name, page);
}

// ---------- Commands ----------

for (const [name, c] of Object.entries(reflection.commands)) {
	const page: CommandPage = {
		name,
		summary: renderInline(c.summary, engineLink),
		scope: c.scope,
		idempotent: c.hints.idempotent,
		destructive: c.hints.destructive,
		params: c.params,
		fields: fields(c.params ? reflection.types[c.params] : undefined),
		examples: (c.examples ?? []).map((args) => ({
			json: highlight(JSON.stringify({ cmd: name, args }, null, 2), "json"),
			cli: highlight(`ara do ${name} --args '${JSON.stringify(args)}' --why "…"`, "powershell"),
		})),
	};
	write("commands", name, page);
}

// ---------- Protocol methods, diagnostic codes, conventions ----------

const docsDir = join(work, "docs");
const methods = readdirSync(join(docsDir, "methods")).map((file) => {
	const name = file.replace(/\.md$/, "");
	const page = markdownPage(readFileSync(join(docsDir, "methods", file), "utf8"), name, () => name);
	write("methods", name, page);
	return { name, summary: page.summary };
});

const errors = readdirSync(join(docsDir, "errors"))
	.map((file) => {
		const code = file.replace(/\.md$/, "");
		const page = markdownPage(readFileSync(join(docsDir, "errors", file), "utf8"), code, (h1) =>
			h1.replace(code, "").trim(),
		);
		write("errors", code, page);
		return { code, title: page.title };
	})
	.sort((a, b) => a.code.localeCompare(b.code, "en", { numeric: true }));

for (const name of ["conventions", "scopes"])
	write(
		"pages",
		name,
		markdownPage(readFileSync(join(docsDir, `${name}.md`), "utf8"), name, (h1) => h1),
	);

// ---------- CLI ----------

/** `ara <command> --help`, split into usage, arguments and options. */
function cliPage(name: string, summary: string): CliPage {
	const help = run([name, "--help"])
		.replace(/ara\.exe/g, "ara")
		.replace(/\r/g, "");
	const usage = help.match(/^Usage: (.*)$/m)?.[1] ?? `ara ${name}`;
	const section = (title: string) => {
		const block = help.split(new RegExp(`^${title}:\\n`, "m"))[1]?.split(/\n\n/)[0] ?? "";
		const entries: { name: string; doc: string }[] = [];
		for (const line of block.split("\n")) {
			// An entry starts shallow with its flag or argument; deeper lines continue its doc.
			const indent = line.length - line.trimStart().length;
			if (indent <= 8 && /^[-[<]/.test(line.trimStart())) {
				const [name, ...doc] = line.trim().split(/ {2,}/);
				entries.push({ name, doc: doc.join(" ") });
			} else if (entries.length && line.trim()) entries[entries.length - 1].doc += ` ${line.trim()}`;
		}
		return entries.map((e) => ({ name: e.name, doc: renderInline(e.doc) }));
	};
	return {
		name,
		summary: renderInline(summary),
		usage: highlight(usage, "powershell"),
		args: section("Arguments"),
		options: section("Options"),
	};
}

const cliList = run(["--help"])
	.split(/^Commands:\n/m)[1]
	.split(/\n\n/)[0]
	.split("\n")
	.map((line) => line.match(/^ {2}(\S+)\s+(.*)$/))
	.filter((m): m is RegExpMatchArray => m !== null && m[1] !== "help")
	.map(([, name, summary]) => {
		write("cli", name, cliPage(name, summary));
		return { name, summary: plain(summary) };
	});

// ---------- Index ----------

const index: DocsIndex = {
	version,
	protocol,
	types: Object.entries(reflection.types)
		.map(([name, t]) => ({ name, kind: t.kind, module: t.module, summary: plain(t.doc) }))
		.sort((a, b) => a.name.localeCompare(b.name)),
	documents: Object.entries(reflection.documents).map(([name, d]) => ({
		name,
		summary: plain(d.doc),
		extension: d.extension,
		idPrefix: d.idPrefix,
		records: d.records,
	})),
	commands: Object.entries(reflection.commands)
		.map(([name, c]) => ({ name, summary: plain(c.summary), scope: c.scope }))
		.sort((a, b) => a.name.localeCompare(b.name)),
	methods,
	errors,
	cli: cliList,
	csharp: rawCsharp.map((t) => ({
		slug: t.slug,
		name: t.name,
		kind: t.kind as CsharpKind,
		summary: plain(t.summary ?? "").split(/\n/)[0],
	})),
};
write("", "index", index);

rmSync(work, { recursive: true, force: true });
console.log(
	`wrote ${index.types.length} types, ${index.commands.length} commands, ${index.methods.length} methods, ` +
		`${index.errors.length} codes, ${index.cli.length} CLI commands and ${index.csharp.length} C# types to ${OUT}`,
);
