import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "#/lib/hooks";
import { cn } from "#/lib/utils";
import { INTRO_BEATS } from "./hero-intro";
import FRAGMENT from "./mashrabiya.frag?raw";

const VERTEX = "attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }";

/** Render scale against CSS pixels; the shader is soft enough to upscale. */
const MAX_DPR = 1.25;

/**
 * The intro, in ms from mount. The hero's logo overlay plays first (see HeroIntro);
 * then the lattice openings light up one by one while the camera settles in.
 */
export const INTRO = {
	revealStart: INTRO_BEATS.land,
	revealMs: 2600,
	settleStart: INTRO_BEATS.land - 200,
	settleMs: 3000,
} as const;

/** 0 → 1 between `start` and `start + duration`, eased out. */
const ramp = (elapsed: number, start: number, duration: number) => {
	const t = Math.min(1, Math.max(0, (elapsed - start) / duration));
	return 1 - (1 - t) ** 3;
};

function compile(gl: WebGLRenderingContext, type: number, source: string) {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
	console.warn("mashrabiya shader:", gl.getShaderInfoLog(shader));
	return null;
}

/** Links the full-screen program, or returns null so the hero falls back to its gradient. */
function createProgram(gl: WebGLRenderingContext) {
	const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
	const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
	const program = gl.createProgram();
	if (!vs || !fs || !program) return null;
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);
	return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}

/**
 * The hero backdrop: light through a mashrabiya, ray-marched live in WebGL.
 * Pauses off screen and in background tabs; draws one still frame under
 * reduced motion (fully lit, no intro).
 */
export function MashrabiyaLight({ className }: { className?: string }) {
	const ref = useRef<HTMLCanvasElement>(null);
	const reduced = useReducedMotion();
	const [shown, setShown] = useState(false);

	useEffect(() => {
		const canvas = ref.current;
		const gl = canvas?.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
		if (!canvas || !gl) return;
		const program = createProgram(gl);
		if (!program) return;

		// biome-ignore lint/correctness/useHookAtTopLevel: WebGL's useProgram, not a React hook
		gl.useProgram(program);
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
		const uRes = gl.getUniformLocation(program, "uRes");
		const uTime = gl.getUniformLocation(program, "uTime");
		const uMouse = gl.getUniformLocation(program, "uMouse");
		const uIntro = gl.getUniformLocation(program, "uIntro");
		const uReveal = gl.getUniformLocation(program, "uReveal");

		// The camera eases towards the pointer for a little parallax.
		const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
		const onPointer = (e: PointerEvent) => {
			mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
			mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
		};

		const start = performance.now();
		const draw = (now: number) => {
			const dpr = Math.min(window.devicePixelRatio, MAX_DPR);
			const w = Math.round(canvas.clientWidth * dpr);
			const h = Math.round(canvas.clientHeight * dpr);
			if (canvas.width !== w || canvas.height !== h) {
				canvas.width = w;
				canvas.height = h;
				gl.viewport(0, 0, w, h);
			}
			mouse.x += (mouse.tx - mouse.x) * 0.04;
			mouse.y += (mouse.ty - mouse.y) * 0.04;
			gl.uniform2f(uRes, w, h);
			gl.uniform1f(uTime, 40 + (now - start) / 1000);
			gl.uniform2f(uMouse, mouse.x, mouse.y);
			const elapsed = reduced ? Number.POSITIVE_INFINITY : now - start;
			gl.uniform1f(uIntro, ramp(elapsed, INTRO.settleStart, INTRO.settleMs));
			gl.uniform1f(uReveal, ramp(elapsed, INTRO.revealStart, INTRO.revealMs));
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		};

		let frame = 0;
		let running = false;
		let onScreen = true;
		let drawn = false;
		const tick = (now: number) => {
			draw(now);
			if (!drawn) {
				drawn = true;
				setShown(true);
			}
			if (running) frame = requestAnimationFrame(tick);
		};
		const update = () => {
			const wanted = !reduced && onScreen && !document.hidden;
			if (wanted && !running) {
				running = true;
				frame = requestAnimationFrame(tick);
			} else if (!wanted && running) {
				running = false;
				cancelAnimationFrame(frame);
			}
		};

		const observer = new IntersectionObserver(([entry]) => {
			onScreen = entry.isIntersecting;
			update();
		});
		observer.observe(canvas);
		document.addEventListener("visibilitychange", update);
		window.addEventListener("pointermove", onPointer);
		if (reduced) requestAnimationFrame(tick);
		update();

		return () => {
			running = false;
			cancelAnimationFrame(frame);
			observer.disconnect();
			document.removeEventListener("visibilitychange", update);
			window.removeEventListener("pointermove", onPointer);
		};
	}, [reduced]);

	return (
		<canvas
			ref={ref}
			aria-hidden
			className={cn("transition-opacity duration-1000", shown ? "opacity-100" : "opacity-0", className)}
		/>
	);
}
