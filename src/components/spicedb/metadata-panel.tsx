import { CheckIcon, CopyIcon, Trash2Icon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";

import { relationshipDeleteRequest } from "./spicedb-graph-node-utils";
import type {
	DeleteRelationshipMutationInput,
	SelectedGraphItem,
} from "./spicedb-visualizer.types";

export function MetadataPanel({
	deletePending,
	onClose,
	onDeleteRelationship,
	selected,
}: {
	deletePending: boolean;
	onClose: () => void;
	onDeleteRelationship: (input: DeleteRelationshipMutationInput) => void;
	selected: SelectedGraphItem | null;
}) {
	if (!selected) {
		return;
	}

	if (selected.type === "edge") {
		const deleteRequest = relationshipDeleteRequest(selected.item);

		return (
			<aside className="rounded-5xl border border-border-default bg-surface-overlay-soft p-5">
				<div className="flex items-start justify-between gap-3">
					<ItemHeading kind={selected.item.kind} label={selected.item.label} />
					<div className="flex shrink-0 items-center gap-2">
						{deleteRequest ? (
							<AlertDialog>
								<AlertDialogTrigger
									render={
										<Button
											disabled={deletePending}
											size="icon-sm"
											variant="destructive"
										>
											<Trash2Icon />
											<span className="sr-only">Delete relationship</span>
										</Button>
									}
								/>
								<AlertDialogContent size="sm">
									<AlertDialogHeader>
										<AlertDialogMedia className="bg-destructive text-text-danger">
											<Trash2Icon />
										</AlertDialogMedia>
										<AlertDialogTitle>
											Delete this relationship?
										</AlertDialogTitle>
										<AlertDialogDescription>
											This will permanently delete {selected.item.label} from{" "}
											{String(selected.item.metadata.resource)} to{" "}
											{String(selected.item.metadata.subject)}. This action
											cannot be undone.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel disabled={deletePending} variant="ghost">
											Cancel
										</AlertDialogCancel>
										<AlertDialogAction
											disabled={deletePending}
											onClick={() =>
												onDeleteRelationship({
													...deleteRequest,
													edgeId: selected.item.id,
												})
											}
											variant="destructive"
										>
											{deletePending ? "Deleting..." : "Delete"}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						) : null}
						<CloseMetadataButton onClose={onClose} />
					</div>
				</div>
				<Separator className="my-4" />
				<MetadataList metadata={selected.item.metadata} />
			</aside>
		);
	}

	return (
		<aside className="rounded-5xl border border-border-default bg-surface-overlay-soft p-5">
			<div className="flex items-start justify-between gap-3">
				<ItemHeading kind={selected.item.kind} label={selected.item.label} />
				<CloseMetadataButton onClose={onClose} />
			</div>
			{selected.item.description ? (
				<p className="mt-3 text-sm leading-6 text-text-caption">
					{selected.item.description}
				</p>
			) : null}
			<Separator className="my-4" />
			<MetadataList metadata={selected.item.metadata} />
		</aside>
	);
}

function ItemHeading({ kind, label }: { kind: string; label: string }) {
	return (
		<div className="min-w-0">
			<p className="text-xs font-bold uppercase tracking-[0.14em] text-text-kicker">
				{kind}
			</p>
			<h2 className="mt-1 break-words font-heading text-2xl font-bold text-text-heading">
				{label}
			</h2>
		</div>
	);
}

function CloseMetadataButton({ onClose }: { onClose: () => void }) {
	return (
		<Button
			aria-label="Close object info"
			className="shrink-0 cursor-pointer"
			onClick={onClose}
			size="icon-xs"
			variant="ghost"
		>
			<XIcon />
		</Button>
	);
}

function MetadataList({ metadata }: { metadata: Record<string, unknown> }) {
	return (
		<dl className="flex flex-col gap-3">
			{Object.entries(metadata).map(([key, value]) => {
				const displayValue = Array.isArray(value)
					? value.join(", ")
					: String(value ?? "none");
				const copyValue =
					key === "objectId" && typeof value === "string"
						? guidPartFromObjectId(value)
						: null;

				return (
					<div className="min-w-0" key={key}>
						<dt className="text-xs font-bold uppercase tracking-[0.14em] text-text-kicker">
							{key}
						</dt>
						<dd className="mt-1 flex min-w-0 items-center gap-2 font-mono text-sm text-text-heading">
							<span className="min-w-0 break-words">{displayValue}</span>
							{copyValue ? <CopyGuidButton value={copyValue} /> : null}
						</dd>
					</div>
				);
			})}
		</dl>
	);
}

function CopyGuidButton({ value }: { value: string }) {
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) {
			return;
		}

		const timeout = window.setTimeout(() => setCopied(false), 750);

		return () => window.clearTimeout(timeout);
	}, [copied]);

	return (
		<Button
			aria-label={copied ? "GUID copied" : "Copy GUID"}
			className="cursor-pointer"
			onClick={() => {
				void navigator.clipboard.writeText(value);
				setCopied(true);
			}}
			size="icon-xs"
			variant="ghost"
		>
			{copied ? <CheckIcon className="text-text-success" /> : <CopyIcon />}
		</Button>
	);
}

export function guidPartFromObjectId(objectId: string) {
	const separatorIndex = objectId.lastIndexOf("_");

	return separatorIndex === -1 ? objectId : objectId.slice(separatorIndex + 1);
}
