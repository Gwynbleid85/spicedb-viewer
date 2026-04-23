import { createFileRoute, redirect } from "@tanstack/react-router";

import { getSafeRedirect } from "#/components/auth/auth-redirect";
import { AuthShell } from "#/components/auth/auth-shell";
import { SignInForm } from "#/components/auth/sign-in-form";
import { getSession } from "#/server/auth/session";

type AuthSearch = {
	redirect?: string;
};

function validateAuthSearch(search: Record<string, unknown>): AuthSearch {
	return {
		redirect: typeof search.redirect === "string" ? search.redirect : undefined,
	};
}

export const Route = createFileRoute("/sign-in")({
	validateSearch: validateAuthSearch,
	beforeLoad: async ({ search }) => {
		const session = await getSession();

		if (session) {
			throw redirect({ to: getSafeRedirect(search.redirect) });
		}
	},
	component: SignIn,
});

function SignIn() {
	const search = Route.useSearch();

	return (
		<AuthShell
			description="Use your email and password to open the protected dashboard."
			mode="sign-in"
			redirectTo={search.redirect}
			title="Sign in"
		>
			<SignInForm redirectTo={search.redirect} />
		</AuthShell>
	);
}
