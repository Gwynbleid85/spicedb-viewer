import type { SpiceDbGraphEdge, SpiceDbGraphNode } from "#/lib/spicedb-graph";

import type { DeleteRelationshipRequest } from "./spicedb-visualizer.types";

function metadataSearchValues(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.flatMap(metadataSearchValues);
	}

	if (value && typeof value === "object") {
		return Object.values(value).flatMap(metadataSearchValues);
	}

	return value == null ? [] : [String(value)];
}

export function matchesNodeSearch(node: SpiceDbGraphNode, query: string) {
	const searchTerm = query.trim().toLowerCase();

	if (searchTerm.length === 0) {
		return false;
	}

	const searchableText = [
		node.id,
		node.kind,
		node.label,
		node.description,
		...Object.entries(node.metadata).flatMap(([key, value]) => [
			key,
			...metadataSearchValues(value),
		]),
	]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();

	return searchableText.includes(searchTerm);
}

export function getObjectType(node: SpiceDbGraphNode) {
	const objectType = node.metadata.objectType;

	return typeof objectType === "string" ? objectType : node.label;
}

export function getObjectId(node: SpiceDbGraphNode) {
	const objectId = node.metadata.objectId;

	return typeof objectId === "string" ? objectId : node.label;
}

function parseRelationshipEndpoint(value: unknown) {
	if (typeof value !== "string") {
		return null;
	}

	const [object, relation] = value.split("#", 2);
	const separatorIndex = object?.indexOf(":") ?? -1;

	if (!object || separatorIndex < 1) {
		return null;
	}

	return {
		id: object.slice(separatorIndex + 1),
		relation,
		type: object.slice(0, separatorIndex),
	};
}

export function relationshipDeleteRequest(edge: SpiceDbGraphEdge) {
	if (edge.kind !== "relationship") {
		return null;
	}

	const resource = parseRelationshipEndpoint(edge.metadata.resource);
	const subject = parseRelationshipEndpoint(edge.metadata.subject);
	const relation = edge.metadata.relation;

	if (!resource || !subject || typeof relation !== "string") {
		return null;
	}

	return {
		resourceId: resource.id,
		resourceType: resource.type,
		relation,
		subjectId: subject.id,
		subjectRelation: subject.relation,
		subjectType: subject.type,
	} satisfies DeleteRelationshipRequest;
}
