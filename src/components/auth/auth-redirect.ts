export function getSafeRedirect(redirectTo: string | undefined) {
	if (redirectTo?.startsWith("/") && !redirectTo.startsWith("//")) {
		return redirectTo;
	}

	return "/dashboard";
}
