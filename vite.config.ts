import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		tailwindcss(),
		// Fully static: every page is prerendered at build time.
		tanstackStart({ prerender: { enabled: true, crawlLinks: true } }),
		viteReact(),
	],
});
