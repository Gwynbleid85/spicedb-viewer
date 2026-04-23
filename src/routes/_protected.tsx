import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { getSession } from "#/server/auth/session";

export const Route = createFileRoute("/_protected")({
	beforeLoad: async ({ location }) => {
		const session = await getSession();

		if (!session) {
			throw redirect({
				to: "/sign-in",
				search: {
					redirect: location.href,
				},
			});
		}

		return {
			user: session.user,
		};
	},
	component: ProtectedLayout,
});

function ProtectedLayout() {
	return <Outlet />;
}
