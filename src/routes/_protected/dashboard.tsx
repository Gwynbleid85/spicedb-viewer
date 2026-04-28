import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { AddShoppingItemForm } from "#/components/shopping/add-shopping-item-form";
import { EditShoppingItemForm } from "#/components/shopping/edit-shopping-item-form";
import { ShoppingListItem } from "#/components/shopping/shopping-list-item";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardTitle } from "#/components/ui/card";
import { authClient } from "#/lib/auth-client";
import {
	type CreateShoppingItemInput,
	shoppingItemsQueryKey,
	type UpdateShoppingItemInput,
} from "#/lib/shopping";
import { shoppingItemsQueryOptions } from "#/lib/shopping-query";
import {
	clearCompletedShoppingItems,
	createShoppingItem,
	deleteShoppingItem,
	listShoppingItems,
	updateShoppingItem,
} from "#/server/functions/shopping.functions";

export const Route = createFileRoute("/_protected/dashboard")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(shoppingItemsQueryOptions()),
	component: Dashboard,
});

function getErrorMessage(error: unknown) {
	return error instanceof Error
		? error.message
		: "Something went wrong. Please try again.";
}

function Dashboard() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { user } = Route.useRouteContext();
	const [editingItemId, setEditingItemId] = useState<string | null>(null);
	const [isSigningOut, setIsSigningOut] = useState(false);

	const listItemsFn = useServerFn(listShoppingItems);
	const createItemFn = useServerFn(createShoppingItem);
	const updateItemFn = useServerFn(updateShoppingItem);
	const deleteItemFn = useServerFn(deleteShoppingItem);
	const clearCompletedItemsFn = useServerFn(clearCompletedShoppingItems);

	const itemsQuery = useQuery({
		queryKey: shoppingItemsQueryKey,
		queryFn: () => listItemsFn(),
	});

	const invalidateItems = () =>
		queryClient.invalidateQueries({ queryKey: shoppingItemsQueryKey });

	const createMutation = useMutation({
		mutationFn: (data: CreateShoppingItemInput) => createItemFn({ data }),
		onSuccess: invalidateItems,
	});

	const updateMutation = useMutation({
		mutationFn: (data: UpdateShoppingItemInput) => updateItemFn({ data }),
		onSuccess: async () => {
			setEditingItemId(null);
			await invalidateItems();
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteItemFn({ data: { id } }),
		onSuccess: invalidateItems,
	});

	const clearCompletedMutation = useMutation({
		mutationFn: () => clearCompletedItemsFn({ data: {} }),
		onSuccess: invalidateItems,
	});

	async function handleSignOut() {
		setIsSigningOut(true);
		await authClient.signOut();
		await router.invalidate();
		await router.navigate({ to: "/sign-in" });
	}

	const items = itemsQuery.data ?? [];
	const completedCount = items.filter((item) => item.completed).length;
	const pendingCount = items.length - completedCount;
	const mutationError =
		createMutation.error ??
		updateMutation.error ??
		deleteMutation.error ??
		clearCompletedMutation.error;

	return (
		<main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8">
			<Card className="gap-0 bg-surface-header py-0 shadow-brand-header">
				<CardContent className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-5">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-text-kicker">
							Shopping list
						</p>
						<CardTitle className="mt-1">Welcome, {user.name}</CardTitle>
					</div>
					<Button
						disabled={isSigningOut}
						onClick={handleSignOut}
						type="button"
						variant="outline"
					>
						{isSigningOut ? "Signing out..." : "Sign out"}
					</Button>
				</CardContent>
			</Card>

			<section className="grid flex-1 gap-5 py-8 lg:grid-cols-[0.95fr_1.35fr]">
				<Card className="h-fit p-0">
					<CardContent className="px-5 py-6">
						<p className="text-xs font-semibold uppercase tracking-wide text-text-kicker">
							Add item
						</p>
						<CardTitle className="mt-2 text-3xl">What do you need?</CardTitle>
						<p className="mt-3 leading-6 text-text-caption">
							This example stores one private list per signed-in user.
						</p>

						<AddShoppingItemForm
							isSubmitting={createMutation.isPending}
							onSubmit={(data) => createMutation.mutateAsync(data)}
						/>
					</CardContent>
				</Card>

				<Card className="p-0">
					<CardContent className="px-5 py-6">
						<div className="flex flex-wrap items-start justify-between gap-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-wide text-text-kicker">
									Your list
								</p>
								<CardTitle className="mt-2 text-3xl">
									{pendingCount} pending
								</CardTitle>
								<p className="mt-2 text-sm text-text-caption">
									{completedCount} completed
								</p>
							</div>
							<Button
								disabled={
									completedCount === 0 || clearCompletedMutation.isPending
								}
								onClick={() => clearCompletedMutation.mutate()}
								type="button"
								variant="outline"
							>
								Clear completed
							</Button>
						</div>

						{itemsQuery.isError ? (
							<Alert className="mt-5" variant="destructive">
								<AlertDescription>
									{getErrorMessage(itemsQuery.error)}
								</AlertDescription>
							</Alert>
						) : null}

						{mutationError ? (
							<Alert className="mt-5" variant="destructive">
								<AlertDescription>
									{getErrorMessage(mutationError)}
								</AlertDescription>
							</Alert>
						) : null}

						<div className="mt-6 flex flex-col gap-3">
							{itemsQuery.isLoading ? (
								<p className="rounded-2xl border border-border-default bg-surface-overlay-soft px-4 py-5 text-sm text-text-caption">
									Loading your shopping list...
								</p>
							) : null}

							{!itemsQuery.isLoading && items.length === 0 ? (
								<p className="rounded-2xl border border-border-default bg-surface-overlay-soft px-4 py-5 text-sm text-text-caption">
									Your list is empty. Add your first item to get started.
								</p>
							) : null}

							{items.map((item) =>
								editingItemId === item.id ? (
									<EditShoppingItemForm
										item={item}
										key={item.id}
										onCancel={() => setEditingItemId(null)}
										onSubmit={(data) => updateMutation.mutateAsync(data)}
									/>
								) : (
									<ShoppingListItem
										isDeleting={deleteMutation.isPending}
										isUpdating={updateMutation.isPending}
										item={item}
										key={item.id}
										onDelete={() => deleteMutation.mutate(item.id)}
										onEdit={() => setEditingItemId(item.id)}
										onToggle={() =>
											updateMutation.mutate({
												id: item.id,
												completed: !item.completed,
											})
										}
									/>
								),
							)}
						</div>
					</CardContent>
				</Card>
			</section>
		</main>
	);
}
