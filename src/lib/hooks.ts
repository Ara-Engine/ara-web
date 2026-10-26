import { type RefObject, useEffect, useState, useSyncExternalStore } from "react";

/** True while the element is on screen; with `once`, stays true after the first sighting. */
export function useInView(ref: RefObject<Element | null>, { once = false, margin = "0px" } = {}) {
	const [inView, setInView] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				setInView(entry.isIntersecting);
				if (entry.isIntersecting && once) observer.disconnect();
			},
			{ rootMargin: margin },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [ref, once, margin]);

	return inView;
}

/**
 * Counts from 0 up to `target` (eased out) once `active`. Holds `target` before that, so
 * server-rendered markup carries the real number; under reduced motion it never moves.
 */
export function useCountUp(target: number, active: boolean, duration = 1400) {
	const reduced = useReducedMotion();
	const [value, setValue] = useState(target);

	useEffect(() => {
		if (!active || reduced) return;
		let frame = 0;
		const start = performance.now();
		const tick = (now: number) => {
			const t = Math.min(1, (now - start) / duration);
			setValue(target * (1 - (1 - t) ** 4));
			if (t < 1) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [target, active, reduced, duration]);

	return value;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** The user's reduced-motion preference; false during SSR. */
export function useReducedMotion() {
	return useSyncExternalStore(
		(onChange) => {
			const query = window.matchMedia(REDUCED_MOTION);
			query.addEventListener("change", onChange);
			return () => query.removeEventListener("change", onChange);
		},
		() => window.matchMedia(REDUCED_MOTION).matches,
		() => false,
	);
}
