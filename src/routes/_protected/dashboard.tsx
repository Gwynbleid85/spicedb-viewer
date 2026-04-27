import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardTitle } from "#/components/ui/card";
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
			<Card className="gap-0 rounded-5xl bg-surface-header py-0 shadow-brand-header">
				<CardContent className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.24em] text-text-kicker">
							Protected
						</p>
						<CardTitle className="mt-1 text-3xl">Dashboard</CardTitle>
					</div>
					<Button
						disabled={isSigningOut}
						onClick={handleSignOut}
						type="button"
						variant="outline"
					>
						{isSigningOut ? "Signing out..." : "Sign out"}
					</Button>
				</CardContent>
			</Card>

			<section className="grid flex-1 items-center py-12">
				<Card className="overflow-hidden rounded-6xl p-8 sm:p-12">
					<CardContent className="max-w-3xl px-0">
						<p className="text-sm font-bold uppercase tracking-[0.24em] text-text-kicker">
							Server checked session
						</p>
						<CardTitle className="mt-4 text-5xl leading-tight">
							Welcome, {user.name}
						</CardTitle>
						<p className="mt-5 text-lg leading-8 text-text-caption">
							This route is inside the pathless protected layout. The layout
							calls a server function from <code>beforeLoad</code>, so direct
							page loads and client-side navigation both require a valid Better
							Auth session.
						</p>
					</CardContent>

					<div className="mt-8 grid gap-4 sm:grid-cols-2">
						<Card
							className="rounded-3xl bg-surface-overlay-soft py-5"
							size="sm"
						>
							<CardContent className="px-5">
								<p className="text-xs font-bold uppercase tracking-[0.2em] text-text-kicker">
									Email
								</p>
								<p className="mt-2 font-semibold text-text-heading">
									{user.email}
								</p>
							</CardContent>
						</Card>
						<Card
							className="rounded-3xl bg-surface-overlay-soft py-5"
							size="sm"
						>
							<CardContent className="px-5">
								<p className="text-xs font-bold uppercase tracking-[0.2em] text-text-kicker">
									User ID
								</p>
								<p className="mt-2 break-all font-mono text-sm text-text-heading">
									{user.id}
								</p>
							</CardContent>
						</Card>
					</div>
				</Card>
			</section>
		</main>
	);
}
