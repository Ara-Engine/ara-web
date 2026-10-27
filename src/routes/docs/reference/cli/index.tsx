import { createFileRoute } from "@tanstack/react-router";
import { DocsPage } from "#/components/docs/docs-page";
import { Listing } from "#/components/docs/reference";
import { docsHead, docsIndex } from "#/lib/docs";

export const Route = createFileRoute("/docs/reference/cli/")({
	component: CliIndex,
	head: () => docsHead("CLI", "The ara command line: every subcommand, argument and option."),
});

/** Every `ara` subcommand. */
function CliIndex() {
	return (
		<DocsPage
			kicker="Reference · CLI"
			title={<span className="font-mono tracking-[-0.03em]">ara</span>}
			lead="The command-line tool and daemon: the single entry point for humans and agents. Add --json to any command for machine-readable output."
		>
			<Listing
				items={docsIndex.cli.map((c) => ({
					href: `/docs/reference/cli/${c.name}`,
					name: `ara ${c.name}`,
					summary: c.summary,
				}))}
			/>
		</DocsPage>
	);
}
