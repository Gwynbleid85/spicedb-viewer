import { describe, expect, it } from "vitest";

import {
	createShoppingItemSchema,
	deleteShoppingItemSchema,
	updateShoppingItemSchema,
} from "#/lib/shopping";

describe("shopping item schemas", () => {
	it("rejects blank item names", () => {
		const result = createShoppingItemSchema.safeParse({
			name: "   ",
			quantity: 1,
		});

		expect(result.success).toBe(false);
	});

	it("trims item names", () => {
		const result = createShoppingItemSchema.parse({
			name: "  Milk  ",
			quantity: 1,
		});

		expect(result.name).toBe("Milk");
	});

	it("rejects quantities below one", () => {
		const result = createShoppingItemSchema.safeParse({
			name: "Milk",
			quantity: 0,
		});

		expect(result.success).toBe(false);
	});

	it("validates mutation IDs", () => {
		expect(updateShoppingItemSchema.safeParse({ id: "" }).success).toBe(false);
		expect(deleteShoppingItemSchema.safeParse({ id: "" }).success).toBe(false);
	});
});
