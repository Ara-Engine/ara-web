import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { renderMarkdown, splitFrontmatter } from "./scripts/markdown.ts";

/**
 * Compiles the manual's .md pages (src/content/manual) at build time into modules:
 * `meta` (title, description, section, order, slug) and the default export, which adds
 * the rendered HTML and the page's headings. See ManualPage in src/lib/docs.ts.
 */
function manualPages(): Plugin {
	return {
		name: "ara-manual-pages",
		enforce: "pre",
		transform(source, id) {
			if (!id.endsWith(".md")) return;
			const { data, body } = splitFrontmatter(source);
			const slug = id.split(/[\\/]/).pop()?.replace(/\.md$/, "") ?? "";
			const meta = {
				slug,
				title: data.title ?? slug,
				description: data.description ?? "",
				section: data.section ?? "Start",
				order: Number(data.order ?? 99),
			};
			const page = { ...meta, ...renderMarkdown(body) };
			return {
				code: `export const meta = ${JSON.stringify(meta)};\nexport default ${JSON.stringify(page)};`,
				map: null,
			};
		},
	};
}

export default defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		manualPages(),
		tailwindcss(),
		// Fully static: every page is prerendered at build time.
		tanstackStart({ prerender: { enabled: true, crawlLinks: true } }),
		viteReact(),
	],
});
