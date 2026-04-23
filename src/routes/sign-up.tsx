import { createFileRoute, redirect } from "@tanstack/react-router";

import { getSafeRedirect } from "#/components/auth/auth-redirect";
import { AuthShell } from "#/components/auth/auth-shell";
import { SignUpForm } from "#/components/auth/sign-up-form";
import { getSession } from "#/server/auth/session";

type AuthSearch = {
	redirect?: string;
};

function validateAuthSearch(search: Record<string, unknown>): AuthSearch {
	return {
		redirect: typeof search.redirect === "string" ? search.redirect : undefined,
	};
}

export const Route = createFileRoute("/sign-up")({
	validateSearch: validateAuthSearch,
	beforeLoad: async ({ search }) => {
		const session = await getSession();

		if (session) {
			throw redirect({ to: getSafeRedirect(search.redirect) });
		}
	},
	component: SignUp,
});

function SignUp() {
	const search = Route.useSearch();

	return (
		<AuthShell
			description="Create a local account with email and password."
			mode="sign-up"
			redirectTo={search.redirect}
			title="Sign up"
		>
			<SignUpForm redirectTo={search.redirect} />
		</AuthShell>
	);
}
