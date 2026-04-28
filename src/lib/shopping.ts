import { z } from "zod";

export const shoppingItemsQueryKey = ["shopping-items"] as const;

export const createShoppingItemSchema = z.object({
	name: z.string().trim().min(1, "Item name is required.").max(120),
	quantity: z.coerce
		.number()
		.int("Quantity must be a whole number.")
		.min(1, "Quantity must be at least 1.")
		.max(999, "Quantity must be 999 or less."),
});

export const updateShoppingItemSchema = z.object({
	id: z.string().min(1, "Item ID is required."),
	name: z.string().trim().min(1, "Item name is required.").max(120).optional(),
	quantity: z.coerce
		.number()
		.int("Quantity must be a whole number.")
		.min(1, "Quantity must be at least 1.")
		.max(999, "Quantity must be 999 or less.")
		.optional(),
	completed: z.boolean().optional(),
});

export const deleteShoppingItemSchema = z.object({
	id: z.string().min(1, "Item ID is required."),
});

export const clearCompletedShoppingItemsSchema = z.object({});

export type CreateShoppingItemInput = z.infer<typeof createShoppingItemSchema>;
export type UpdateShoppingItemInput = z.infer<typeof updateShoppingItemSchema>;
export type DeleteShoppingItemInput = z.infer<typeof deleteShoppingItemSchema>;
export type CreateShoppingItemFormValues = z.input<
	typeof createShoppingItemSchema
>;
export type UpdateShoppingItemFormValues = z.input<
	typeof updateShoppingItemSchema
>;

export type ShoppingItem = {
	completed: boolean;
	id: string;
	name: string;
	quantity: number;
};
