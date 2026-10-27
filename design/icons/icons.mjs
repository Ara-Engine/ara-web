// Ara's application icons: the engine (editor), the Hub, and a built game's default.
//
//   node design/icons/icons.mjs
//
// Writes each icon's SVG sources (full detail, and a simplified drawing for 16–32 px)
// next to this file, and into out/: PNGs at every size plus a Windows .ico (16–256 px,
// PNG-compressed entries). Rasterized with resvg, so no browser is needed.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out");
const SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];
/** At and below this size, the simplified drawing is used. */
const SMALL = 32;

// ---------- The mark (64-unit grid, from src/components/brand.tsx) ----------

const FACETS = [
	"30.58 3.37 5.01 28.02 26.01 33.5", // top left, lit
	"33.06 3.02 28.44 33.52 58.94 27.97", // top right
	"5.35 30.59 30.44 60.16 25.96 35.97", // bottom left
	"28.4 35.97 33 60.82 58.78 30.44", // bottom right, shaded
];
const WINDOW = "27 26 34 35 27 44 20 35";
/** Facet fills, lit (top left) to shaded. Neutral greys: no blue in the brand. */
const ON_DARK = ["#ffffff", "#e0e0e0", "#a3a3a3", "#7a7a7a"];
const ON_LIGHT = ["#4a4a4a", "#303030", "#1a1a1a", "#0a0a0a"];

/** The crystal with its window cut out, in the mark's 64 grid (wrap it in a transform). */
const crystal = (tones, mask) => `
		<mask id="${mask}"><rect x="-8" y="-8" width="80" height="80" fill="#fff"/><polygon points="${WINDOW}" fill="#000"/></mask>
		<g mask="url(#${mask})">${FACETS.map((p, i) => `<polygon points="${p}" fill="${tones[i]}"/>`).join("")}</g>`;

/** A rounded tile with a soft top-down light and a hairline edge. */
const tile = (id, top, bottom, edge, edgeOpacity) => `
	<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>
	<rect width="64" height="64" rx="14" fill="url(#${id})"/>
	<rect x="0.5" y="0.5" width="63" height="63" rx="13.5" fill="none" stroke="${edge}" stroke-opacity="${edgeOpacity}"/>`;

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${body}\n</svg>\n`;

// ---------- Engine (editor): the crystal, its window lit ----------

const engine = (small) =>
	svg(`
	<title>Ara</title>${tile("tile", "#1d1d1d", "#050505", "#fff", 0.1)}
	<defs><radialGradient id="glow"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
	<g transform="${small ? "translate(3.5 3.6) scale(0.89)" : "translate(7.2 7.4) scale(0.775)"}">${crystal(ON_DARK, "window")}
		${small ? "" : `<circle cx="27" cy="35" r="11" fill="url(#glow)"/>`}
		<polygon points="27 ${small ? "31" : "30.2"} ${small ? "30" : "30.6"} 35 27 ${small ? "39" : "39.8"} ${small ? "24" : "23.4"} 35" fill="#fff"/>
	</g>`);

// ---------- Hub: the emblem, inverted onto a light tile ----------

const hub = (small) =>
	svg(`
	<title>Ara Hub</title>${tile("tile", "#fafafa", "#d6d6d6", "#000", 0.12)}
	<circle cx="32" cy="32" r="${small ? 24 : 22.5}" fill="none" stroke="#0a0a0a" stroke-width="${small ? 4.2 : 2.6}"/>
	<g transform="${small ? "translate(16.6 16.6) scale(0.48)" : "translate(17.4 17.5) scale(0.455)"}">${crystal(ON_LIGHT, "window")}
	</g>`);

// ---------- A built game's default: the crystal as glass ----------

/** Facet glass on dark, lit (top left) to shaded: faint fills under lit edges. */
const GLASS = [0.3, 0.2, 0.11, 0.06];

/**
 * The crystal drawn in light: thin lit edges over faint facets, its window outlined.
 * Unmistakably Ara, but a frame rather than a solid mark: the game's icon goes here.
 */
const game = (small) =>
	svg(`
	<title>Ara game</title>${tile("tile", "#1a1a1a", "#050505", "#fff", 0.1)}
	<defs><radialGradient id="glow" cx="0.42" cy="0.45"><stop offset="0" stop-color="#fff" stop-opacity="0.16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
	<rect x="2" y="2" width="60" height="60" rx="12" fill="url(#glow)"/>
	<g transform="${small ? "translate(4.6 4.7) scale(0.86)" : "translate(8 8.2) scale(0.75)"}" stroke="#fff" stroke-linejoin="round">
		<mask id="window"><rect x="-8" y="-8" width="80" height="80" fill="#fff"/><polygon points="${WINDOW}" fill="#000"/></mask>
		<g mask="url(#window)">${FACETS.map(
			(p, i) =>
				`<polygon points="${p}" fill="#fff" fill-opacity="${small ? GLASS[i] * 1.6 : GLASS[i]}" stroke-opacity="${small ? 0.95 : 0.85}" stroke-width="${small ? 2.6 : 1.3}"/>`,
		).join("")}</g>
		<polygon points="${WINDOW}" fill="none" stroke-opacity="0.9" stroke-width="${small ? 2.4 : 1.2}"/>
	</g>`);

// ---------- Output ----------

/** A Windows .ico holding PNG-compressed images (Vista and later read these at every size). */
function ico(pngs) {
	const header = Buffer.alloc(6 + 16 * pngs.length);
	header.writeUInt16LE(0, 0);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(pngs.length, 4);
	let offset = header.length;
	pngs.forEach(({ size, data }, i) => {
		const e = 6 + 16 * i;
		header.writeUInt8(size >= 256 ? 0 : size, e);
		header.writeUInt8(size >= 256 ? 0 : size, e + 1);
		header.writeUInt16LE(1, e + 4); // colour planes
		header.writeUInt16LE(32, e + 6); // bits per pixel
		header.writeUInt32LE(data.length, e + 8);
		header.writeUInt32LE(offset, e + 12);
		offset += data.length;
	});
	return Buffer.concat([header, ...pngs.map((p) => p.data)]);
}

const render = (source, size) => new Resvg(source, { fitTo: { mode: "width", value: size } }).render().asPng();

mkdirSync(OUT, { recursive: true });
for (const [name, draw] of Object.entries({ "ara-engine": engine, "ara-hub": hub, "ara-game": game })) {
	const full = draw(false);
	const small = draw(true);
	writeFileSync(join(HERE, `${name}.svg`), full);
	writeFileSync(join(HERE, `${name}-small.svg`), small);
	const pngs = SIZES.map((size) => ({ size, data: render(size <= SMALL ? small : full, size) }));
	for (const { size, data } of pngs) writeFileSync(join(OUT, `${name}-${size}.png`), data);
	writeFileSync(join(OUT, `${name}.ico`), ico(pngs.filter((p) => ICO_SIZES.includes(p.size))));
	console.log(`${name}: ${SIZES.join(", ")} px and ${name}.ico`);
}
