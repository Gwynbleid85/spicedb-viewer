import { createFileRoute, Link } from "@tanstack/react-router";

import { Badge } from "#/components/ui/badge";
import { Button, buttonVariants } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

const authSteps = [
	{
		label: "1",
		title: "Create an account",
		description:
			"Email and password credentials are persisted through Better Auth and Drizzle.",
	},
	{
		label: "2",
		title: "Receive a session",
		description:
			"TanStack Start cookies keep the authenticated session available during SSR.",
	},
	{
		label: "3",
		title: "Enter protected routes",
		description:
			"The pathless layout checks the session in beforeLoad before rendering private UI.",
	},
];

function Home() {
	return (
		<main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
			<Card className="gap-0 bg-surface-header py-0 shadow-brand-header">
				<CardContent className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-5">
					<Link className="group flex items-center gap-3 no-underline" to="/">
						<span className="grid size-9 place-items-center rounded-lg bg-surface-strong font-heading text-base font-bold text-text-on-strong">
							T
						</span>
						<span>
							<span className="block text-xs font-semibold uppercase tracking-wide text-text-kicker">
								TanStack Start
							</span>
							<span className="block font-heading text-lg font-bold text-text-heading">
								Better Auth Kit
							</span>
						</span>
					</Link>

					<nav className="flex flex-wrap items-center gap-2">
						<Link
							className={cn(
								buttonVariants({ variant: "ghost", size: "sm" }),
								"no-underline",
							)}
							to="/sign-in"
						>
							Sign in
						</Link>
						<Link
							className={cn(
								buttonVariants({ variant: "default", size: "sm" }),
								"no-underline",
							)}
							to="/sign-up"
						>
							Sign up
						</Link>
					</nav>
				</CardContent>
			</Card>

			<section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1fr_0.9fr] lg:py-16">
				<div className="max-w-2xl">
					<Badge>Server-first auth</Badge>

					<h1 className="mt-6 font-heading text-4xl font-bold leading-tight text-text-heading sm:text-5xl">
						A protected app shell, already wired.
					</h1>
					<p className="mt-5 text-base leading-7 text-text-caption sm:text-lg">
						This template now ships with Better Auth, SQLite-backed Drizzle
						tables, email/password pages, and a TanStack Router protected layout
						that redirects anonymous visitors before private routes render.
					</p>

					<div className="mt-7 flex flex-col gap-3 sm:flex-row">
						<Button
							render={<Link className="no-underline" to="/sign-up" />}
							size="lg"
						>
							Create account
						</Button>
						<Link
							className={cn(
								buttonVariants({ variant: "outline", size: "lg" }),
								"no-underline",
							)}
							to="/dashboard"
						>
							Test protected route
						</Link>
					</div>
				</div>

				<div>
					<Card className="p-0 sm:p-0">
						<CardHeader className="flex items-center justify-between gap-4 border-b border-border-default px-5 py-5 sm:flex-row">
							<div>
								<p className="text-xs font-semibold uppercase tracking-wide text-text-kicker">
									Auth status
								</p>
								<CardTitle className="mt-1">Protected layout</CardTitle>
							</div>
							<Badge variant="success">Live</Badge>
						</CardHeader>

						<CardContent className="flex flex-col gap-3 px-5 py-5">
							{authSteps.map((step) => (
								<Card
									className="bg-surface-overlay-soft py-4"
									key={step.title}
									size="sm"
								>
									<CardContent className="px-4">
										<div className="flex gap-3">
											<span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border-default bg-surface-panel text-sm font-semibold text-text-heading">
												{step.label}
											</span>
											<div>
												<h3 className="font-semibold text-text-heading">
													{step.title}
												</h3>
												<p className="mt-1 leading-6 text-text-caption">
													{step.description}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</CardContent>

						<Separator />

						<CardContent className="px-5 py-5">
							<div className="rounded-2xl border border-border-default bg-surface-overlay-soft p-4">
								<p className="text-xs font-semibold uppercase tracking-wide text-text-kicker">
									Current guard
								</p>
								<p className="mt-2 font-mono text-sm leading-6 text-text-caption">
									/dashboard → beforeLoad → getSession() → redirect or render
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>
		</main>
	);
}
