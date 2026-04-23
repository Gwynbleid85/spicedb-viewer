import { describe, expect, it } from "vitest";

import { getSafeRedirect } from "#/components/auth/auth-redirect";

describe("getSafeRedirect", () => {
	it("allows only safe relative redirects", () => {
		expect(getSafeRedirect("/settings")).toBe("/settings");
		expect(getSafeRedirect("https://example.com")).toBe("/dashboard");
		expect(getSafeRedirect("//evil.test")).toBe("/dashboard");
		expect(getSafeRedirect(undefined)).toBe("/dashboard");
	});
});
