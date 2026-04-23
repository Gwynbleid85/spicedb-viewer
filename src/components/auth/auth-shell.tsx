import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { getSafeRedirect } from "#/components/auth/auth-redirect";

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
		<div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-12">
			<div className="grid w-full overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface-strong)] shadow-2xl shadow-emerald-950/10 backdrop-blur md:grid-cols-[0.9fr_1.1fr]">
				<div className="relative hidden overflow-hidden bg-[var(--sea-ink)] p-10 text-white md:block">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(96,215,207,0.42),transparent_34%),radial-gradient(circle_at_85%_85%,rgba(110,200,154,0.28),transparent_38%)]" />
					<div className="relative flex h-full flex-col justify-between">
						<p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-100/80">
							TanStack Start
						</p>
						<div>
							<h1 className="font-serif text-5xl font-bold leading-tight">
								Auth that starts on the server.
							</h1>
							<p className="mt-5 max-w-sm text-base leading-7 text-emerald-50/78">
								Better Auth handles sessions and cookies while protected routes
								stay guarded by TanStack Router beforeLoad checks.
							</p>
						</div>
					</div>
				</div>

				<div className="p-8 sm:p-12">
					<div className="mb-9">
						<p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--kicker)]">
							{isSignUp ? "Create account" : "Welcome back"}
						</p>
						<h2 className="mt-3 font-serif text-4xl font-bold text-[var(--sea-ink)]">
							{title}
						</h2>
						<p className="mt-3 text-[var(--sea-ink-soft)]">{description}</p>
					</div>

					{children}

					<p className="mt-8 text-center text-sm text-[var(--sea-ink-soft)]">
						{isSignUp ? "Already have an account?" : "Need an account?"}{" "}
						<Link
							className="font-bold"
							search={{ redirect: safeRedirect }}
							to={isSignUp ? "/sign-in" : "/sign-up"}
						>
							{isSignUp ? "Sign in" : "Sign up"}
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
