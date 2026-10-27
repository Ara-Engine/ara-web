// Markdown → HTML for the docs, at build time only: the manual's .md pages (through the
// Vite plugin in vite.config.ts) and the engine's generated docs (scripts/sync-engine.ts).
// Code is highlighted by Shiki into CSS variables (`--code-*` in styles.css), so code
// blocks follow the site's palette; `> **Note:**`-style blockquotes become callouts.

import { Marked, type Tokens } from "marked";
import { createHighlighter } from "shiki";

/** An h2/h3 on the page, for its outline. */
export type Heading = { depth: 2 | 3; text: string; id: string };

export type Rendered = { html: string; headings: Heading[] };

/** Rewrites a link's href (e.g. the engine's relative `types/Light.md` to a site URL). */
export type LinkRewriter = (href: string) => string;

const LANGS = ["csharp", "json", "shellscript", "powershell", "toml", "rust", "text"] as const;
const ALIASES: Record<string, string> = {
	cs: "csharp",
	"c#": "csharp",
	sh: "shellscript",
	bash: "shellscript",
	ps1: "powershell",
	jsonc: "json",
	txt: "text",
	"": "text",
};

/** Token colours as CSS variables, defined in styles.css. */
const THEME = {
	name: "ara",
	type: "dark" as const,
	colors: { "editor.background": "var(--code-background)", "editor.foreground": "var(--code-fg)" },
	tokenColors: [
		{ scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "var(--code-comment)" } },
		{
			scope: ["keyword", "storage", "storage.type", "storage.modifier", "constant.language", "variable.language"],
			settings: { foreground: "var(--code-keyword)" },
		},
		{
			scope: ["string", "constant.character", "punctuation.definition.string"],
			settings: { foreground: "var(--code-string)" },
		},
		{ scope: ["constant.numeric"], settings: { foreground: "var(--code-number)" } },
		{
			scope: [
				"entity.name.type",
				"entity.name.class",
				"entity.name.struct",
				"entity.name.namespace",
				"support.type",
				"support.class",
			],
			settings: { foreground: "var(--code-type)" },
		},
		{ scope: ["entity.name.function", "support.function"], settings: { foreground: "var(--code-function)" } },
		{
			scope: ["support.type.property-name", "meta.object-literal.key", "entity.name.tag", "variable.parameter"],
			settings: { foreground: "var(--code-property)" },
		},
	],
};

const highlighter = await createHighlighter({ themes: [THEME], langs: [...LANGS.filter((l) => l !== "text")] });

/** Highlighted code as a <pre>, in the site's palette. */
export function highlight(code: string, lang = "text"): string {
	const resolved = ALIASES[lang] ?? lang;
	const known = (LANGS as readonly string[]).includes(resolved) ? resolved : "text";
	return highlighter.codeToHtml(code.replace(/\n$/, ""), { lang: known, theme: "ara" });
}

/** A heading's id, GitHub-style (so `#anchors` written against GitHub previews keep working). */
const slugify = (text: string) =>
	text
		.toLowerCase()
		.replace(/<[^>]+>/g, "")
		.replace(/&[a-z]+;|&#\d+;/g, "")
		.replace(/[^\w\s-]/g, "")
		.trim()
		.replace(/\s/g, "-");

const CALLOUT = /^<p><strong>(Note|Warning|Gap|Tip):<\/strong>\s*/;

/** A configured Marked that records headings into `headings` and rewrites links. */
function createMarked(headings: Heading[], rewrite: LinkRewriter) {
	const ids = new Map<string, number>();
	return new Marked({
		gfm: true,
		renderer: {
			heading({ tokens, depth }: Tokens.Heading) {
				const html = this.parser.parseInline(tokens);
				const base = slugify(html) || "section";
				const seen = ids.get(base) ?? 0;
				ids.set(base, seen + 1);
				const id = seen ? `${base}-${seen}` : base;
				if (depth === 2 || depth === 3) headings.push({ depth, text: html.replace(/<[^>]+>/g, ""), id });
				return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${html}</h${depth}>\n`;
			},
			code({ text, lang }: Tokens.Code) {
				const language = (lang ?? "").split(/\s/)[0];
				return `<div class="code-block" data-lang="${language || "text"}">${highlight(text, language)}</div>\n`;
			},
			blockquote({ tokens }: Tokens.Blockquote) {
				const body = this.parser.parse(tokens);
				const kind = body.match(CALLOUT)?.[1];
				if (!kind) return `<blockquote>${body}</blockquote>\n`;
				return `<aside class="callout" data-kind="${kind.toLowerCase()}"><p><strong>${kind}</strong> ${body.replace(CALLOUT, "")}</aside>\n`;
			},
			link({ href, title, tokens }: Tokens.Link) {
				const target = rewrite(href);
				const text = this.parser.parseInline(tokens);
				const external = /^https?:/.test(target);
				const attrs = `${title ? ` title="${title}"` : ""}${external ? ' target="_blank" rel="noreferrer"' : ""}`;
				return `<a href="${target}"${attrs}>${text}</a>`;
			},
			table(token: Tokens.Table) {
				const cell = (c: Tokens.TableCell, tag: "th" | "td") =>
					`<${tag}${c.align ? ` style="text-align:${c.align}"` : ""}>${this.parser.parseInline(c.tokens)}</${tag}>`;
				const head = `<tr>${token.header.map((c) => cell(c, "th")).join("")}</tr>`;
				const rows = token.rows.map((r) => `<tr>${r.map((c) => cell(c, "td")).join("")}</tr>`).join("");
				return `<div class="table-wrap"><table><thead>${head}</thead><tbody>${rows}</tbody></table></div>\n`;
			},
		},
	});
}

/** A whole Markdown document. */
export function renderMarkdown(source: string, rewrite: LinkRewriter = (href) => href): Rendered {
	const headings: Heading[] = [];
	const html = createMarked(headings, rewrite).parse(source, { async: false });
	return { html, headings };
}

/** One line of Markdown (a field's doc, a summary), without a wrapping <p>. */
export function renderInline(source: string, rewrite: LinkRewriter = (href) => href): string {
	return createMarked([], rewrite).parseInline(source, { async: false });
}

/** Splits `---`-fenced frontmatter of simple `key: value` lines from the body. */
export function splitFrontmatter(source: string): { data: Record<string, string>; body: string } {
	const match = source.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
	if (!match) return { data: {}, body: source };
	const data: Record<string, string> = {};
	for (const line of match[1].split("\n")) {
		const kv = line.match(/^([\w-]+):\s*(.*)$/);
		if (kv) data[kv[1]] = kv[2].replace(/^(["'])(.*)\1$/, "$2");
	}
	return { data, body: match[2] };
}
