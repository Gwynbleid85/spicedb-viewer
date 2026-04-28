import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "#/components/ui/button";
import {
	Field,
	FieldContent,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
	type CreateShoppingItemFormValues,
	type CreateShoppingItemInput,
	createShoppingItemSchema,
} from "#/lib/shopping";

type AddShoppingItemFormProps = {
	isSubmitting: boolean;
	onSubmit: (data: CreateShoppingItemInput) => Promise<unknown>;
};

export function AddShoppingItemForm({
	isSubmitting,
	onSubmit,
}: AddShoppingItemFormProps) {
	const {
		register,
		reset,
		handleSubmit,
		formState: { errors },
	} = useForm<CreateShoppingItemFormValues, unknown, CreateShoppingItemInput>({
		defaultValues: {
			name: "",
			quantity: 1,
		},
		resolver: zodResolver(createShoppingItemSchema),
	});

	async function submit(data: CreateShoppingItemInput) {
		await onSubmit(data);
		reset({ name: "", quantity: 1 });
	}

	return (
		<form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(submit)}>
			<FieldGroup>
				<Field data-invalid={errors.name ? "true" : undefined}>
					<FieldLabel htmlFor="shopping-item-name">Item</FieldLabel>
					<FieldContent>
						<Input
							id="shopping-item-name"
							placeholder="Stuff to buy"
							aria-invalid={errors.name ? "true" : "false"}
							{...register("name")}
						/>
						<FieldError errors={[errors.name]} />
					</FieldContent>
				</Field>

				<Field data-invalid={errors.quantity ? "true" : undefined}>
					<FieldLabel htmlFor="shopping-item-quantity">Quantity</FieldLabel>
					<FieldContent>
						<Input
							id="shopping-item-quantity"
							min={1}
							type="number"
							aria-invalid={errors.quantity ? "true" : "false"}
							{...register("quantity")}
						/>
						<FieldError errors={[errors.quantity]} />
					</FieldContent>
				</Field>
			</FieldGroup>

			<Button disabled={isSubmitting} type="submit">
				{isSubmitting ? "Adding..." : "Add item"}
			</Button>
		</form>
	);
}
