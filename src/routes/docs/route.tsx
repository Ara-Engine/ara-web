import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { DocsSidebar } from "#/components/docs/docs-sidebar";
import { SiteFooter } from "#/components/site-footer";
import { SiteHeader } from "#/components/site-header";

export const Route = createFileRoute("/docs")({ component: DocsLayout });

/**
 * The docs' frame: the site header (solid), the sidebar beside every page on wide
 * screens (a sheet behind "Menu" on narrow ones), and a faint wash of the hero's
 * lattice light over the top of the page.
 */
function DocsLayout() {
	return (
		<>
			<SiteHeader solid />
			<div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem] overflow-hidden">
				<div className="bg-lattice-lit absolute -top-40 right-[-10%] h-[44rem] w-[60rem] rotate-[24deg] opacity-[0.035] [mask-image:radial-gradient(closest-side,black,transparent)]" />
			</div>
			<div className="mx-auto flex max-w-[96rem] gap-10 px-5 md:px-8 xl:gap-14">
				<aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-60 shrink-0 overflow-y-auto overscroll-contain py-10 pr-2 [scrollbar-width:thin] lg:block">
					<DocsSidebar />
				</aside>
				<main className="min-w-0 flex-1 pt-8 lg:pt-14">
					<MobileNav />
					<Outlet />
				</main>
			</div>
			<SiteFooter />
		</>
	);
}

/** The sidebar as a sheet from the left, for screens without room for it. */
function MobileNav() {
	const [open, setOpen] = useState(false);

	return (
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<Dialog.Trigger className="mb-8 flex items-center gap-2 border border-white/12 px-3 py-1.5 text-[0.875rem] text-muted-foreground transition-colors hover:text-foreground lg:hidden">
				<Menu className="size-4" />
				Menu
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
				<Dialog.Content
					// Following a link closes the sheet.
					onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
					className="fixed inset-y-0 left-0 z-50 w-[min(20rem,85vw)] overflow-y-auto border-r border-white/10 bg-background px-4 py-6 data-[state=open]:animate-in data-[state=open]:slide-in-from-left"
				>
					<div className="mb-6 flex items-center justify-between pl-3">
						<Dialog.Title className="font-mono text-[0.6875rem] tracking-[0.18em] text-muted-foreground uppercase">
							Documentation
						</Dialog.Title>
						<Dialog.Close aria-label="Close" className="p-1 text-muted-foreground hover:text-foreground">
							<X className="size-4" />
						</Dialog.Close>
					</div>
					<Dialog.Description className="sr-only">Pages of the Ara documentation.</Dialog.Description>
					<DocsSidebar />
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
