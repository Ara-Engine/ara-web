import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { TooltipProvider } from "#/components/ui/tooltip";
import appCss from "../styles.css?url";

const TITLE = "Ara: an AI-native game engine";
const DESCRIPTION =
	"A Rust game engine with Unreal-level fidelity, Unity-level ease, C# scripting with sub-second hot reload, and AI agents as first-class users.";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: TITLE },
			{ name: "description", content: DESCRIPTION },
			{ name: "theme-color", content: "#0a0a0a" },
			{ property: "og:type", content: "website" },
			{ property: "og:title", content: TITLE },
			{ property: "og:description", content: DESCRIPTION },
			{ property: "og:image", content: "/media/sponza.jpg" },
			{ name: "twitter:card", content: "summary_large_image" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/brand/favicon.svg", type: "image/svg+xml" },
			{ rel: "icon", href: "/favicon.ico", sizes: "any" },
			{ rel: "apple-touch-icon", href: "/brand/ara-icon-512.png" },
			{ rel: "preload", href: "/media/sponza.jpg", as: "image" },
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<TooltipProvider delayDuration={150}>{children}</TooltipProvider>
				<Scripts />
			</body>
		</html>
	);
}
