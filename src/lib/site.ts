/** The engine release this page describes. Bump with each engine release. */
export const ENGINE_VERSION = "0.0.1-alpha";

const REPO = "https://github.com/Ara-Engine/ara";

/** A file in the engine repo on `main`, for linking a claim to its evidence. */
export const source = (path: string) => `${REPO}/blob/main/${path}`;

/** External links used across the site. */
export const links = {
	repo: REPO,
	releases: `${REPO}/releases`,
	hubRelease: `${REPO}/releases/tag/hub-v${ENGINE_VERSION}`,
	hubInstaller: `${REPO}/releases/download/hub-v${ENGINE_VERSION}/ara-hub-${ENGINE_VERSION}-windows-x64-setup.exe`,
	releaseNotes: source("RELEASE_NOTES.md"),
	knownIssues: source("docs/KNOWN_ISSUES.md"),
	decisions: source("docs/decisions.md"),
	milestones: source("docs/plan/milestones.md"),
} as const;

/** Where each published number comes from. */
export const evidence = {
	fidelity: source("crates/ara-pathtrace/FIDELITY_ROUND3.md"),
	virtualGeometry: source("crates/ara-render-geo/reports/rendering-scale.html"),
	simulation: source("crates/ara-sim/BENCH.md"),
	animation: source("crates/ara-anim/README.md"),
	hotReload: source("crates/ara-script/AGENTS.md"),
	arabench: source("crates/arabench/results/README.md"),
	performanceBar: source("RELEASE_NOTES.md"),
	doorSample: source("dotnet/samples/Outpost.Sample/Door.cs"),
} as const;

/** Page sections, shared by the header nav and the command palette. */
export const sections = [
	{ id: "agents", label: "Agents" },
	{ id: "scripting", label: "Scripting" },
	{ id: "benchmarks", label: "Benchmarks" },
	{ id: "get-started", label: "Get started" },
] as const;

export type SectionId = (typeof sections)[number]["id"];
