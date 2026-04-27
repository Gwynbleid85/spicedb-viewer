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
		<main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-5 py-10 sm:px-6">
			<Card className="w-full p-0">
				<CardContent className="p-6 sm:p-8">
					<div className="mb-7">
						<p className="text-xs font-semibold uppercase tracking-wide text-text-kicker">
							{isSignUp ? "Create account" : "Welcome back"}
						</p>
						<CardTitle className="mt-2 text-3xl">{title}</CardTitle>
						<CardDescription className="mt-2">{description}</CardDescription>
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
