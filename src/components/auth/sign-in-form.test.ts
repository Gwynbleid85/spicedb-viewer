import { describe, expect, it } from "vitest";

import { signInSchema } from "#/components/auth/sign-in-form";

describe("signInSchema", () => {
	it("rejects invalid email and short password", () => {
		const result = signInSchema.safeParse({
			email: "bad-email",
			password: "short",
		});

		expect(result.success).toBe(false);

		if (result.success) {
			throw new Error("Expected validation to fail.");
		}

		expect(result.error.issues.map((issue) => issue.message)).toEqual([
			"Enter a valid email address.",
			"Password must be at least 8 characters.",
		]);
	});
});
