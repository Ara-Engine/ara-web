import { createFileRoute } from "@tanstack/react-router";
import { Agents } from "#/components/home/agents";
import { Benchmarks } from "#/components/home/benchmarks";
import { GetStarted } from "#/components/home/get-started";
import { Hero } from "#/components/home/hero";
import { ProofStrip } from "#/components/home/proof-strip";
import { Scripting } from "#/components/home/scripting";
import { SiteFooter } from "#/components/site-footer";
import { SiteHeader } from "#/components/site-header";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<>
			<SiteHeader />
			<main>
				<Hero />
				<ProofStrip />
				<Agents />
				<Scripting />
				<Benchmarks />
				<GetStarted />
			</main>
			<SiteFooter />
		</>
	);
}
