import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/_protected/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const router = useRouter();
	const { user } = Route.useRouteContext();
	const [isSigningOut, setIsSigningOut] = useState(false);

	async function handleSignOut() {
		setIsSigningOut(true);
		await authClient.signOut();
		await router.invalidate();
		await router.navigate({ to: "/sign-in" });
	}

	return (
		<main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
			<header className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-[var(--line)] bg-[var(--header-bg)] px-6 py-4 shadow-xl shadow-emerald-950/5 backdrop-blur">
				<div>
					<p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--kicker)]">
						Protected
					</p>
					<h1 className="mt-1 font-serif text-3xl font-bold text-[var(--sea-ink)]">
						Dashboard
					</h1>
				</div>
				<button
					className="rounded-2xl border border-[var(--line)] bg-white/75 px-5 py-3 text-sm font-bold text-[var(--sea-ink)] transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
					disabled={isSigningOut}
					onClick={handleSignOut}
					type="button"
				>
					{isSigningOut ? "Signing out..." : "Sign out"}
				</button>
			</header>

			<section className="grid flex-1 items-center py-12">
				<div className="overflow-hidden rounded-[2.5rem] border border-[var(--line)] bg-[var(--surface-strong)] p-8 shadow-2xl shadow-emerald-950/10 backdrop-blur sm:p-12">
					<div className="max-w-3xl">
						<p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--kicker)]">
							Server checked session
						</p>
						<h2 className="mt-4 font-serif text-5xl font-bold leading-tight text-[var(--sea-ink)]">
							Welcome, {user.name}
						</h2>
						<p className="mt-5 text-lg leading-8 text-[var(--sea-ink-soft)]">
							This route is inside the pathless protected layout. The layout
							calls a server function from <code>beforeLoad</code>, so direct
							page loads and client-side navigation both require a valid Better
							Auth session.
						</p>
					</div>

					<div className="mt-8 grid gap-4 sm:grid-cols-2">
						<div className="rounded-3xl border border-[var(--line)] bg-white/70 p-5">
							<p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--kicker)]">
								Email
							</p>
							<p className="mt-2 font-semibold text-[var(--sea-ink)]">
								{user.email}
							</p>
						</div>
						<div className="rounded-3xl border border-[var(--line)] bg-white/70 p-5">
							<p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--kicker)]">
								User ID
							</p>
							<p className="mt-2 break-all font-mono text-sm text-[var(--sea-ink)]">
								{user.id}
							</p>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
