/*
 * The engine reference as the docs site stores it: written by `pnpm sync-engine`
 * (scripts/sync-engine.ts) into src/content/engine/, one JSON file per page plus an
 * index. HTML fields are pre-rendered at sync time, so pages only insert them.
 */

/** A field of a schema type, or a param of a command. */
export type FieldDoc = {
	name: string;
	/** The schema type, e.g. `option<LightKind>`, with known types linked (HTML). */
	typeHtml: string;
	/** HTML. */
	doc: string;
	/** JSON. */
	default?: string;
	unit?: string;
	/** "0 – 1", "≥ 0.01". */
	range?: string;
	options?: string[];
	required?: boolean;
	/** Network replication, e.g. "owner, interpolated". */
	replicate?: string;
	/** When the editor shows it, e.g. "kind is point or spot". */
	showIf?: string;
};

export type SchemaKind = "component" | "struct" | "record" | "enum" | "params";

export type TypePage = {
	name: string;
	kind: SchemaKind;
	module?: string;
	/** HTML. */
	doc: string;
	fields: FieldDoc[];
	/** Enum variants. */
	variants: { name: string; doc: string }[];
	/** Records: the ID prefix (`e`, `sc` …). */
	prefix?: string;
	/** Who refers to this type. */
	usedBy: { types: string[]; commands: string[] };
	/** Components: ready-made usage snippets (highlighted HTML). */
	usage?: { label: string; html: string }[];
	/** Components: the C# struct, when scripts can reach it. */
	csharp?: string;
};

export type CommandPage = {
	name: string;
	/** HTML. */
	summary: string;
	scope: string;
	idempotent: boolean;
	destructive: boolean;
	params?: string;
	fields: FieldDoc[];
	/** Highlighted HTML, one per example: the JSON call and the same call from the CLI. */
	examples: { json: string; cli: string }[];
};

/** A page the engine only ships as Markdown (protocol methods, diagnostic codes, conventions). */
export type MarkdownPage = {
	name: string;
	title: string;
	summary: string;
	html: string;
	headings: { depth: 2 | 3; text: string; id: string }[];
};

export type CliPage = {
	name: string;
	summary: string;
	/** Highlighted HTML. */
	usage: string;
	args: { name: string; doc: string }[];
	options: { name: string; doc: string }[];
};

export type CsharpMember = {
	kind: "constructor" | "property" | "field" | "event" | "method" | "operator";
	name: string;
	/** Highlighted HTML. */
	signature: string;
	summary?: string;
	remarks?: string;
	example?: string;
	returns?: string;
	value?: string;
	params: { name: string; summary?: string }[];
	typeParams: { name: string; summary?: string }[];
};

export type CsharpKind = "class" | "struct" | "interface" | "enum" | "attribute" | "delegate";

export type CsharpType = {
	slug: string;
	name: string;
	namespace: string;
	kind: CsharpKind;
	/** Highlighted HTML. */
	declaration: string;
	summary?: string;
	remarks?: string;
	example?: string;
	typeParams: { name: string; summary?: string }[];
	members: CsharpMember[];
	values: { name: string; value: string; summary?: string }[];
	/** The schema component this struct binds, when it's an engine component. */
	component?: string;
};

/** Everything a listing, the sidebar or search needs; summaries are plain text. */
export type DocsIndex = {
	version: string;
	protocol: string;
	types: { name: string; kind: SchemaKind; module?: string; summary: string }[];
	documents: { name: string; summary: string; extension: string; idPrefix: string; records: string[] }[];
	commands: { name: string; summary: string; scope: string }[];
	methods: { name: string; summary: string }[];
	errors: { code: string; title: string }[];
	cli: { name: string; summary: string }[];
	csharp: { slug: string; name: string; kind: CsharpKind; summary: string }[];
};
