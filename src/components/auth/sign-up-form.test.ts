import { describe, expect, it } from "vitest";

import { signUpSchema } from "#/components/auth/sign-up-form";

describe("signUpSchema", () => {
	it("requires name, a valid email, and a long enough password", () => {
		const result = signUpSchema.safeParse({
			name: "   ",
			email: "bad-email",
			password: "short",
		});

		expect(result.success).toBe(false);

		if (result.success) {
			throw new Error("Expected validation to fail.");
		}

		expect(result.error.issues.map((issue) => issue.message)).toEqual([
			"Name is required.",
			"Enter a valid email address.",
			"Password must be at least 8 characters.",
		]);
	});
});
