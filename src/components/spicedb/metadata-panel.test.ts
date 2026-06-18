import { describe, expect, it } from "vitest";

import { guidPartFromObjectId } from "./metadata-panel";

describe("guidPartFromObjectId", () => {
	it("returns only the GUID suffix after the underscore", () => {
		expect(
			guidPartFromObjectId(
				"test-tenant-k-six-a_019d2a01-a009-7009-8009-a00000000009",
			),
		).toBe("019d2a01-a009-7009-8009-a00000000009");
	});

	it("uses the last underscore when the prefix contains underscores", () => {
		expect(guidPartFromObjectId("tenant_prefix_abc-123")).toBe("abc-123");
	});
});
