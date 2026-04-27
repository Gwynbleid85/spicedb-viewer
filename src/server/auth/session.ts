import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";

export const getCurrentSession = createServerOnlyFn(async () => {
	const { auth } = await import("./auth");
	const { getRequestHeaders } = await import("@tanstack/react-start/server");
	const headers = getRequestHeaders();

	return auth.api.getSession({ headers });
});

export const getSession = createServerFn({ method: "GET" }).handler(async () =>
	getCurrentSession(),
);
