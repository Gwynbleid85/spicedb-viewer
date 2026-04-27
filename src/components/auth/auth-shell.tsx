import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { getSafeRedirect } from "#/components/auth/auth-redirect";
import { buttonVariants } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from "#/components/ui/card";
import { cn } from "#/lib/utils";

type AuthShellProps = {
	children: ReactNode;
	description: string;
	mode: "sign-in" | "sign-up";
	redirectTo?: string;
	title: string;
};

export function AuthShell({
	children,
	description,
	mode,
	redirectTo,
	title,
}: AuthShellProps) {
	const safeRedirect = getSafeRedirect(redirectTo);
	const isSignUp = mode === "sign-up";

	return (
		<main className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center overflow-hidden px-6 py-12 sm:px-8">
			<div className="pointer-events-none absolute left-1/2 top-16 h-64 w-64 -translate-x-1/2 rounded-full bg-page-glow-1 blur-3xl" />
			<Card className="grid w-full gap-0 p-0 md:grid-cols-[0.9fr_1.1fr]">
				<div className="relative hidden overflow-hidden bg-surface-strong p-10 text-text-on-strong md:block">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(96,215,207,0.42),transparent_34%),radial-gradient(circle_at_85%_85%,rgba(110,200,154,0.28),transparent_38%)]" />
					<div className="relative flex h-full flex-col justify-between">
						<p className="text-sm font-semibold uppercase text-text-on-strong-soft">
							TanStack Start
						</p>
						<div>
							<h1 className="font-heading text-5xl font-bold leading-tight text-text-on-strong">
								Auth that starts on the server.
							</h1>
							<p className="mt-5 max-w-sm text-base leading-7 text-text-on-strong-muted">
								Better Auth handles sessions and cookies while protected routes
								stay guarded by TanStack Router beforeLoad checks.
							</p>
						</div>
					</div>
				</div>

				<CardContent className="p-8 sm:p-12">
					<div className="mb-9">
						<p className="text-sm font-bold uppercase tracking-[0.24em] text-text-kicker">
							{isSignUp ? "Create account" : "Welcome back"}
						</p>
						<CardTitle className="mt-3 text-4xl">{title}</CardTitle>
						<CardDescription className="mt-3">{description}</CardDescription>
					</div>

					{children}

					<p className="mt-8 text-center text-sm text-text-caption">
						{isSignUp ? "Already have an account?" : "Need an account?"}{" "}
						<Link
							className={cn(
								buttonVariants({ variant: "link", size: "xs" }),
								"min-h-0 font-bold",
							)}
							search={{ redirect: safeRedirect }}
							to={isSignUp ? "/sign-in" : "/sign-up"}
						>
							{isSignUp ? "Sign in" : "Sign up"}
						</Link>
					</p>
				</CardContent>
			</Card>
		</main>
	);
}
