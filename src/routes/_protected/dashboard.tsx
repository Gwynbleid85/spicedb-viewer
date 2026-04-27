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
		<main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8">
			<Card className="gap-0 bg-surface-header py-0 shadow-brand-header">
				<CardContent className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-5">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-text-kicker">
							Protected
						</p>
						<CardTitle className="mt-1">Dashboard</CardTitle>
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

			<section className="grid flex-1 items-center py-10">
				<Card className="p-0">
					<CardContent className="px-5 py-6 sm:px-6 sm:py-8">
						<p className="text-xs font-semibold uppercase tracking-wide text-text-kicker">
							Server checked session
						</p>
						<CardTitle className="mt-3 text-3xl leading-tight sm:text-4xl">
							Welcome, {user.name}
						</CardTitle>
						<p className="mt-4 max-w-3xl text-base leading-7 text-text-caption">
							This route is inside the pathless protected layout. The layout
							calls a server function from <code>beforeLoad</code>, so direct
							page loads and client-side navigation both require a valid Better
							Auth session.
						</p>

						<div className="mt-7 grid gap-3 sm:grid-cols-2">
							<Card className="bg-surface-overlay-soft py-4" size="sm">
								<CardContent className="px-4">
									<p className="text-xs font-semibold uppercase tracking-wide text-text-kicker">
										Email
									</p>
									<p className="mt-2 font-semibold text-text-heading">
										{user.email}
									</p>
								</CardContent>
							</Card>
							<Card className="bg-surface-overlay-soft py-4" size="sm">
								<CardContent className="px-4">
									<p className="text-xs font-semibold uppercase tracking-wide text-text-kicker">
										User ID
									</p>
									<p className="mt-2 break-all font-mono text-sm text-text-heading">
										{user.id}
									</p>
								</CardContent>
							</Card>
						</div>
					</CardContent>
				</Card>
			</section>
		</main>
	);
}
