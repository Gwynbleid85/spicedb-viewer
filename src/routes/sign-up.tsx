import { createFileRoute, redirect } from "@tanstack/react-router";

import { AuthForm } from "#/components/auth/auth-form";
import { getSession } from "#/server/auth/session";

type AuthSearch = {
	redirect?: string;
};

function validateAuthSearch(search: Record<string, unknown>): AuthSearch {
	return {
		redirect: typeof search.redirect === "string" ? search.redirect : undefined,
	};
}

function getSafeRedirect(redirectTo: string | undefined) {
	if (redirectTo?.startsWith("/") && !redirectTo.startsWith("//")) {
		return redirectTo;
	}

	return "/dashboard";
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

	return <AuthForm mode="sign-up" redirectTo={search.redirect} />;
}
