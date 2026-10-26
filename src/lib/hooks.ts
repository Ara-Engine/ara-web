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
