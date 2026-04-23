import { Link, useRouter } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useState } from "react";

import { authClient } from "#/lib/auth-client";

type AuthFormProps = {
	mode: "sign-in" | "sign-up";
	redirectTo?: string;
};

function getSafeRedirect(redirectTo: string | undefined) {
	if (redirectTo?.startsWith("/") && !redirectTo.startsWith("//")) {
		return redirectTo;
	}

	return "/dashboard";
}

export function AuthForm({ mode, redirectTo }: AuthFormProps) {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, setIsPending] = useState(false);

	const isSignUp = mode === "sign-up";
	const safeRedirect = getSafeRedirect(redirectTo);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setIsPending(true);

		const result = isSignUp
			? await authClient.signUp.email({
					name,
					email,
					password,
					callbackURL: safeRedirect,
				})
			: await authClient.signIn.email({
					email,
					password,
					callbackURL: safeRedirect,
				});

		setIsPending(false);

		if (result.error) {
			setError(result.error.message ?? "Authentication failed.");
			return;
		}

		await router.invalidate();
		window.location.assign(safeRedirect);
	}

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
							{isSignUp ? "Sign up" : "Sign in"}
						</h2>
						<p className="mt-3 text-[var(--sea-ink-soft)]">
							{isSignUp
								? "Create a local account with email and password."
								: "Use your email and password to open the protected dashboard."}
						</p>
					</div>

					<form className="space-y-5" onSubmit={handleSubmit}>
						{isSignUp ? (
							<label className="block">
								<span className="text-sm font-semibold text-[var(--sea-ink)]">
									Name
								</span>
								<input
									autoComplete="name"
									className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3 text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon)] focus:ring-4 focus:ring-teal-200/40"
									onChange={(event) => setName(event.target.value)}
									required
									value={name}
								/>
							</label>
						) : null}

						<label className="block">
							<span className="text-sm font-semibold text-[var(--sea-ink)]">
								Email
							</span>
							<input
								autoComplete="email"
								className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3 text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon)] focus:ring-4 focus:ring-teal-200/40"
								onChange={(event) => setEmail(event.target.value)}
								required
								type="email"
								value={email}
							/>
						</label>

						<label className="block">
							<span className="text-sm font-semibold text-[var(--sea-ink)]">
								Password
							</span>
							<input
								autoComplete={isSignUp ? "new-password" : "current-password"}
								className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3 text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon)] focus:ring-4 focus:ring-teal-200/40"
								minLength={8}
								onChange={(event) => setPassword(event.target.value)}
								required
								type="password"
								value={password}
							/>
						</label>

						{error ? (
							<p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
								{error}
							</p>
						) : null}

						<button
							className="w-full rounded-2xl bg-[var(--sea-ink)] px-5 py-3 font-bold text-white shadow-lg shadow-emerald-950/10 transition hover:-translate-y-0.5 hover:bg-[var(--palm)] disabled:cursor-not-allowed disabled:opacity-60"
							disabled={isPending}
							type="submit"
						>
							{isPending
								? "Working..."
								: isSignUp
									? "Create account"
									: "Sign in"}
						</button>
					</form>

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
