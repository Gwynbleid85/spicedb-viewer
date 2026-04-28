import { queryOptions } from "@tanstack/react-query";

import { shoppingItemsQueryKey } from "#/lib/shopping";
import { listShoppingItems } from "#/server/functions/shopping.functions";

export function shoppingItemsQueryOptions() {
	return queryOptions({
		queryKey: shoppingItemsQueryKey,
		queryFn: () => listShoppingItems(),
	});
}
