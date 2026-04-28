import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "#/components/ui/button";
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
	type ShoppingItem,
	type UpdateShoppingItemFormValues,
	type UpdateShoppingItemInput,
	updateShoppingItemSchema,
} from "#/lib/shopping";

type EditShoppingItemFormProps = {
	item: ShoppingItem;
	onCancel: () => void;
	onSubmit: (data: UpdateShoppingItemInput) => Promise<unknown>;
};

export function EditShoppingItemForm({
	item,
	onCancel,
	onSubmit,
}: EditShoppingItemFormProps) {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<UpdateShoppingItemFormValues, unknown, UpdateShoppingItemInput>({
		defaultValues: {
			id: item.id,
			name: item.name,
			quantity: item.quantity,
		},
		resolver: zodResolver(updateShoppingItemSchema),
	});

	return (
		<form
			className="rounded-2xl border border-border-default bg-surface-overlay-soft p-4"
			onSubmit={handleSubmit(onSubmit)}
		>
			<input type="hidden" {...register("id")} />
			<div className="grid gap-3 sm:grid-cols-[1fr_7rem_auto]">
				<Field data-invalid={errors.name ? "true" : undefined}>
					<FieldLabel htmlFor={`shopping-item-edit-name-${item.id}`}>
						Item
					</FieldLabel>
					<FieldContent>
						<Input
							id={`shopping-item-edit-name-${item.id}`}
							aria-invalid={errors.name ? "true" : "false"}
							{...register("name")}
						/>
						<FieldError errors={[errors.name]} />
					</FieldContent>
				</Field>

				<Field data-invalid={errors.quantity ? "true" : undefined}>
					<FieldLabel htmlFor={`shopping-item-edit-quantity-${item.id}`}>
						Qty
					</FieldLabel>
					<FieldContent>
						<Input
							id={`shopping-item-edit-quantity-${item.id}`}
							min={1}
							type="number"
							aria-invalid={errors.quantity ? "true" : "false"}
							{...register("quantity")}
						/>
						<FieldError errors={[errors.quantity]} />
					</FieldContent>
				</Field>

				<div className="flex items-end gap-2">
					<Button disabled={isSubmitting} size="sm" type="submit">
						Save
					</Button>
					<Button onClick={onCancel} size="sm" type="button" variant="ghost">
						Cancel
					</Button>
				</div>
			</div>
		</form>
	);
}
