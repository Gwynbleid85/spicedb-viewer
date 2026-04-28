import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "#/server/db/client";
import { shoppingItem } from "#/server/db/schema";

export type ShoppingItemDto = {
	completed: boolean;
	id: string;
	name: string;
	quantity: number;
};

type CreateShoppingItemValues = {
	name: string;
	quantity: number;
	userId: string;
};

type UpdateShoppingItemValues = {
	completed?: boolean;
	id: string;
	name?: string;
	quantity?: number;
	userId: string;
};

function toShoppingItemDto(
	item: typeof shoppingItem.$inferSelect,
): ShoppingItemDto {
	return {
		completed: item.completed,
		id: item.id,
		name: item.name,
		quantity: item.quantity,
	};
}

export async function listShoppingItemsForUser(
	userId: string,
): Promise<Array<ShoppingItemDto>> {
	const items = await db
		.select()
		.from(shoppingItem)
		.where(eq(shoppingItem.userId, userId))
		.orderBy(asc(shoppingItem.completed), desc(shoppingItem.createdAt));

	return items.map(toShoppingItemDto);
}

export async function createShoppingItemForUser({
	name,
	quantity,
	userId,
}: CreateShoppingItemValues): Promise<ShoppingItemDto> {
	const now = new Date();
	const [item] = await db
		.insert(shoppingItem)
		.values({
			id: crypto.randomUUID(),
			userId,
			name,
			quantity,
			completed: false,
			createdAt: now,
			updatedAt: now,
		})
		.returning();

	if (!item) {
		throw new Error("Could not create shopping item.");
	}

	return toShoppingItemDto(item);
}

export async function updateShoppingItemForUser({
	completed,
	id,
	name,
	quantity,
	userId,
}: UpdateShoppingItemValues): Promise<ShoppingItemDto> {
	const [item] = await db
		.update(shoppingItem)
		.set({
			...(name === undefined ? {} : { name }),
			...(quantity === undefined ? {} : { quantity }),
			...(completed === undefined ? {} : { completed }),
			updatedAt: new Date(),
		})
		.where(and(eq(shoppingItem.id, id), eq(shoppingItem.userId, userId)))
		.returning();

	if (!item) {
		throw new Error("Shopping item was not found.");
	}

	return toShoppingItemDto(item);
}

export async function deleteShoppingItemForUser({
	id,
	userId,
}: {
	id: string;
	userId: string;
}): Promise<void> {
	await db
		.delete(shoppingItem)
		.where(and(eq(shoppingItem.id, id), eq(shoppingItem.userId, userId)));
}

export async function clearCompletedShoppingItemsForUser(
	userId: string,
): Promise<{ deletedCount: number }> {
	const deletedItems = await db
		.delete(shoppingItem)
		.where(
			and(eq(shoppingItem.userId, userId), eq(shoppingItem.completed, true)),
		)
		.returning({ id: shoppingItem.id });

	return { deletedCount: deletedItems.length };
}
