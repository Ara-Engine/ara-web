// The link-preview (Open Graph) cards: the hero's mashrabiya light, rendered by its real
// shader, with the site's type over it. One card for the site, one for the docs.
//
//   node design/og/og.mjs
//
// Writes public/og/{ara,docs}.jpg at 1200×630. Renders in Chromium through
// playwright-core: the newest browser under %LOCALAPPDATA%\ms-playwright, or CHROME.

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "public", "og");
const WIDTH = 1200;
const HEIGHT = 630;
/** Shader clock for the frame: the sun, clouds and camera drift, so this picks the light. */
const TIME = 46;

const fragment = readFileSync(join(ROOT, "src/components/home/mashrabiya.frag"), "utf8");
const font = (pkg, file) => pathToFileURL(join(ROOT, "node_modules/@fontsource-variable", pkg, "files", file)).href;

// The crystal (src/components/brand.tsx), lit facet first.
const FACETS = [
	"30.58 3.37 5.01 28.02 26.01 33.5",
	"33.06 3.02 28.44 33.52 58.94 27.97",
	"5.35 30.59 30.44 60.16 25.96 35.97",
	"28.4 35.97 33 60.82 58.78 30.44",
];
const WINDOW = "27 26 34 35 27 44 20 35";
const crystal = `<svg viewBox="0 0 64 64"><mask id="w"><rect width="64" height="64" fill="#fff"/><polygon points="${WINDOW}" fill="#000"/></mask><g mask="url(#w)">${FACETS.map(
	(p, i) => `<polygon points="${p}" fill="#fafafa" fill-opacity="${[1, 0.88, 0.62, 0.48][i]}"/>`,
).join("")}</g></svg>`;

const CARDS = {
	ara: {
		eyebrow: "Public alpha · Windows",
		title: "An AI-native<br>game engine.",
		lede: "Unreal-level fidelity with Unity-level ease. Every edit, from you, a C# script or an agent, is a typed command you can undo.",
		url: "ara.snowydev.xyz",
	},
	docs: {
		eyebrow: "Documentation",
		title: "Ara docs.",
		lede: "The manual, the C# scripting API and the engine reference: every component, command and diagnostic code.",
		url: "ara.snowydev.xyz/docs",
	},
};

const html = (card) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Inter; src: url(${font("inter", "inter-latin-wght-normal.woff2")}) format("woff2"); font-weight: 100 900; }
@font-face { font-family: Mono; src: url(${font("jetbrains-mono", "jetbrains-mono-latin-wght-normal.woff2")}) format("woff2"); font-weight: 100 800; }
* { margin: 0; box-sizing: border-box; }
body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; background: #0a0a0a; color: #fafafa; font-family: Inter; }
canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.shade { position: absolute; inset: 0; background:
	linear-gradient(90deg, rgb(10 10 10 / 0.94) 0%, rgb(10 10 10 / 0.78) 34%, rgb(10 10 10 / 0.2) 62%, transparent 78%),
	linear-gradient(0deg, rgb(10 10 10 / 0.85) 0%, transparent 30%); }
.card { position: absolute; inset: 0; padding: 64px 72px; display: flex; flex-direction: column; }
.logo { display: flex; align-items: center; gap: 14px; font-size: 34px; font-weight: 600; letter-spacing: -0.04em; }
.logo svg { width: 44px; height: 44px; }
.eyebrow { margin-top: auto; display: flex; align-items: center; gap: 16px; font: 500 16px Mono; letter-spacing: 0.16em; text-transform: uppercase; color: #fafafa; }
.eyebrow i { width: 9px; height: 9px; background: #fafafa; transform: rotate(45deg); border-radius: 1px; }
h1 { margin-top: 22px; font-size: 92px; line-height: 0.96; font-weight: 600; letter-spacing: -0.045em; text-shadow: 0 2px 40px rgb(0 0 0 / 0.6); }
p { margin-top: 26px; max-width: 590px; font-size: 24px; line-height: 1.45; color: rgb(250 250 250 / 0.7); text-wrap: pretty; }
.url { position: absolute; right: 72px; bottom: 64px; font: 500 17px Mono; letter-spacing: 0.04em; color: rgb(250 250 250 / 0.75); text-shadow: 0 1px 12px #000; }
</style></head><body>
<canvas width="${WIDTH * 2}" height="${HEIGHT * 2}"></canvas>
<div class="shade"></div>
<div class="card">
	<div class="logo">${crystal}Ara</div>
	<div class="eyebrow"><i></i>${card.eyebrow}</div>
	<h1>${card.title}</h1>
	<p>${card.lede}</p>
</div>
<div class="url">${card.url}</div>
<script>
const canvas = document.querySelector("canvas");
const gl = canvas.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: true });
const shader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
	if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
const program = gl.createProgram();
gl.attachShader(program, shader(gl.VERTEX_SHADER, "attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }"));
gl.attachShader(program, shader(gl.FRAGMENT_SHADER, ${JSON.stringify(fragment)}));
gl.linkProgram(program);
gl.useProgram(program);
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
gl.viewport(0, 0, canvas.width, canvas.height);
const u = (name) => gl.getUniformLocation(program, name);
gl.uniform2f(u("uRes"), canvas.width, canvas.height);
gl.uniform1f(u("uTime"), ${TIME});
gl.uniform2f(u("uMouse"), 0, 0);
gl.uniform1f(u("uIntro"), 1);
gl.uniform1f(u("uReveal"), 1);
gl.drawArrays(gl.TRIANGLES, 0, 3);
document.fonts.ready.then(() => { window.ready = true; });
</script></body></html>`;

function browserPath() {
	if (process.env.CHROME) return process.env.CHROME;
	const base = join(process.env.LOCALAPPDATA ?? "", "ms-playwright");
	const newest = readdirSync(base)
		.filter((d) => /^chromium-\d+$/.test(d))
		.sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
		.pop();
	if (!newest) throw new Error(`No Chromium under ${base}; set CHROME.`);
	return join(base, newest, "chrome-win64", "chrome.exe");
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
	executablePath: browserPath(),
	args: ["--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--allow-file-access-from-files"],
});
for (const [name, card] of Object.entries(CARDS)) {
	const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
	page.on("pageerror", (e) => console.error(name, e.message));
	// A file URL, so the page may load the fonts from node_modules.
	const file = join(OUT, `.${name}.html`);
	writeFileSync(file, html(card));
	await page.goto(pathToFileURL(file).href);
	await page.waitForFunction(() => window.ready === true);
	await page.screenshot({ path: join(OUT, `${name}.jpg`), type: "jpeg", quality: 90 });
	rmSync(file);
	await page.close();
	console.log(`public/og/${name}.jpg`);
}
await browser.close();
