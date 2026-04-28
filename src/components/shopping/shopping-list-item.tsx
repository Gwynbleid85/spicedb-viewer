import { Button } from "#/components/ui/button";
import type { ShoppingItem } from "#/lib/shopping";

type ShoppingListItemProps = {
	isDeleting: boolean;
	isUpdating: boolean;
	item: ShoppingItem;
	onDelete: () => void;
	onEdit: () => void;
	onToggle: () => void;
};

export function ShoppingListItem({
	isDeleting,
	isUpdating,
	item,
	onDelete,
	onEdit,
	onToggle,
}: ShoppingListItemProps) {
	return (
		<div className="flex flex-col gap-3 rounded-2xl border border-border-default bg-surface-overlay-soft p-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<p
					className={
						item.completed
							? "font-semibold text-text-caption line-through"
							: "font-semibold text-text-heading"
					}
				>
					{item.name}
				</p>
				<p className="mt-1 text-sm text-text-caption">Qty {item.quantity}</p>
			</div>

			<div className="flex flex-wrap gap-2">
				<Button
					disabled={isUpdating}
					onClick={onToggle}
					size="sm"
					type="button"
					variant={item.completed ? "secondary" : "outline"}
				>
					{item.completed ? "Mark pending" : "Mark done"}
				</Button>
				<Button onClick={onEdit} size="sm" type="button" variant="outline">
					Edit
				</Button>
				<Button
					disabled={isDeleting}
					onClick={onDelete}
					size="sm"
					type="button"
					variant="destructive"
				>
					Delete
				</Button>
			</div>
		</div>
	);
}
