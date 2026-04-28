import { createServerFn } from "@tanstack/react-start";

import {
	clearCompletedShoppingItemsSchema,
	createShoppingItemSchema,
	deleteShoppingItemSchema,
	updateShoppingItemSchema,
} from "#/lib/shopping";
import { getSession } from "#/server/auth/session";
import {
	clearCompletedShoppingItemsForUser,
	createShoppingItemForUser,
	deleteShoppingItemForUser,
	listShoppingItemsForUser,
	updateShoppingItemForUser,
} from "#/server/repositories/shopping.repository";

class SafeShoppingError extends Error {}

async function requireUserId() {
	const session = await getSession();

	if (!session) {
		throw new SafeShoppingError("Sign in to manage your shopping list.");
	}

	return session.user.id;
}

function toSafeError(error: unknown, fallbackMessage: string) {
	if (error instanceof SafeShoppingError) {
		return error;
	}

	if (
		error instanceof Error &&
		(error.message === "Shopping item was not found." ||
			error.message === "Could not create shopping item.")
	) {
		return error;
	}

	console.error(error);
	return new Error(fallbackMessage);
}

export const listShoppingItems = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const userId = await requireUserId();

			return listShoppingItemsForUser(userId);
		} catch (error) {
			throw toSafeError(error, "Could not load your shopping list.");
		}
	},
);

export const createShoppingItem = createServerFn({ method: "POST" })
	.inputValidator(createShoppingItemSchema)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();

			return createShoppingItemForUser({
				userId,
				name: data.name,
				quantity: data.quantity,
			});
		} catch (error) {
			throw toSafeError(error, "Could not add the shopping item.");
		}
	});

export const updateShoppingItem = createServerFn({ method: "POST" })
	.inputValidator(updateShoppingItemSchema)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();

			return updateShoppingItemForUser({
				userId,
				id: data.id,
				name: data.name,
				quantity: data.quantity,
				completed: data.completed,
			});
		} catch (error) {
			throw toSafeError(error, "Could not update the shopping item.");
		}
	});

export const deleteShoppingItem = createServerFn({ method: "POST" })
	.inputValidator(deleteShoppingItemSchema)
	.handler(async ({ data }) => {
		try {
			const userId = await requireUserId();

			await deleteShoppingItemForUser({
				userId,
				id: data.id,
			});

			return { ok: true };
		} catch (error) {
			throw toSafeError(error, "Could not delete the shopping item.");
		}
	});

export const clearCompletedShoppingItems = createServerFn({ method: "POST" })
	.inputValidator(clearCompletedShoppingItemsSchema)
	.handler(async () => {
		try {
			const userId = await requireUserId();

			return clearCompletedShoppingItemsForUser(userId);
		} catch (error) {
			throw toSafeError(error, "Could not clear completed shopping items.");
		}
	});
