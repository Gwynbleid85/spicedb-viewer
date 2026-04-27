import type { v1 } from "@authzed/authzed-node";

export type SpiceDbGraphMode = "schema" | "relationships";

export type SpiceDbGraphNodeKind =
	| "definition"
	| "relation"
	| "permission"
	| "caveat"
	| "object"
	| "wildcard";

export type SpiceDbGraphEdgeKind =
	| "defines"
	| "allows"
	| "depends-on"
	| "uses-caveat"
	| "relationship";

export type SpiceDbGraphMetadata = Record<
	string,
	boolean | number | string | string[] | null
>;

export type SpiceDbGraphNode = {
	id: string;
	label: string;
	kind: SpiceDbGraphNodeKind;
	description?: string;
	metadata: SpiceDbGraphMetadata;
};

export type SpiceDbGraphEdge = {
	id: string;
	source: string;
	target: string;
	label: string;
	kind: SpiceDbGraphEdgeKind;
	metadata: SpiceDbGraphMetadata;
};

export type SpiceDbGraphStats = {
	nodeCount: number;
	edgeCount: number;
	definitionCount?: number;
	relationCount?: number;
	permissionCount?: number;
	caveatCount?: number;
	relationshipCount?: number;
};

export type SpiceDbGraph = {
	mode: SpiceDbGraphMode;
	nodes: SpiceDbGraphNode[];
	edges: SpiceDbGraphEdge[];
	stats: SpiceDbGraphStats;
	readAt?: string;
	truncated: boolean;
	limit?: number;
	message?: string;
};

type SchemaGraphInput = {
	definitions: v1.ReflectionDefinition[];
	caveats: v1.ReflectionCaveat[];
	dependencies?: Array<{
		permissionDefinitionName: string;
		permissionName: string;
		relation: v1.ReflectionRelationReference;
	}>;
	readAt?: string;
};

type RelationshipGraphInput = {
	relationships: v1.Relationship[];
	limit: number;
	truncated: boolean;
};

function compactComment(comment: string) {
	return comment.replaceAll(/\/\*+|\*+\/|^\s*\*\s?/gm, "").trim();
}

function objectNodeId(objectType: string, objectId: string) {
	return `object:${objectType}:${objectId}`;
}

function definitionNodeId(name: string) {
	return `definition:${name}`;
}

function addNode(nodes: Map<string, SpiceDbGraphNode>, node: SpiceDbGraphNode) {
	if (!nodes.has(node.id)) {
		nodes.set(node.id, node);
	}
}

function addEdge(edges: Map<string, SpiceDbGraphEdge>, edge: SpiceDbGraphEdge) {
	if (!edges.has(edge.id)) {
		edges.set(edge.id, edge);
	}
}

function subjectTargetLabel(subjectType: v1.ReflectionTypeReference) {
	if (subjectType.typeref.oneofKind === "optionalRelationName") {
		return `${subjectType.subjectDefinitionName}#${subjectType.typeref.optionalRelationName}`;
	}

	if (subjectType.typeref.oneofKind === "isPublicWildcard") {
		return `${subjectType.subjectDefinitionName}:*`;
	}

	return subjectType.subjectDefinitionName;
}

function caveatMetadata(caveat?: v1.ReflectionCaveat): SpiceDbGraphMetadata {
	if (!caveat) {
		return {};
	}

	return {
		caveatComment: compactComment(caveat.comment) || null,
		caveatExpression: caveat.expression,
		caveatParameters: caveat.parameters.map(
			(parameter) => `${parameter.name}: ${parameter.type}`,
		),
	};
}

export function createSchemaGraph(input: SchemaGraphInput): SpiceDbGraph {
	const nodes = new Map<string, SpiceDbGraphNode>();
	const edges = new Map<string, SpiceDbGraphEdge>();
	const knownDefinitions = new Set(
		input.definitions.map((definition) => definition.name),
	);
	const caveatsByName = new Map(
		input.caveats.map((caveat) => [caveat.name, caveat]),
	);

	for (const definition of input.definitions) {
		const definitionId = definitionNodeId(definition.name);

		addNode(nodes, {
			id: definitionId,
			label: definition.name,
			kind: "definition",
			description: compactComment(definition.comment),
			metadata: {
				permissions: definition.permissions.map(
					(permission) => permission.name,
				),
				permissionCount: definition.permissions.length,
				relationCount: definition.relations.length,
				relations: definition.relations.map((relation) => relation.name),
			},
		});

		for (const relation of definition.relations) {
			for (const subjectType of relation.subjectTypes) {
				const targetId = definitionNodeId(subjectType.subjectDefinitionName);
				const caveatName = subjectType.optionalCaveatName;
				const subjectLabel = subjectTargetLabel(subjectType);
				const publicWildcard =
					subjectType.typeref.oneofKind === "isPublicWildcard";
				const subjectRelation =
					subjectType.typeref.oneofKind === "optionalRelationName"
						? subjectType.typeref.optionalRelationName
						: null;

				if (
					!knownDefinitions.has(subjectType.subjectDefinitionName) &&
					!nodes.has(targetId)
				) {
					addNode(nodes, {
						id: targetId,
						label: subjectType.subjectDefinitionName,
						kind: "definition",
						metadata: {
							external: true,
							permissions: [],
							permissionCount: 0,
							relationCount: 0,
							relations: [],
						},
					});
				}

				addEdge(edges, {
					id: `allows:${definitionId}:${targetId}:${relation.name}:${subjectLabel}:${caveatName}`,
					source: definitionId,
					target: targetId,
					label: caveatName
						? `${relation.name} [${caveatName}]`
						: relation.name,
					kind: "allows",
					metadata: {
						caveat: caveatName || null,
						publicWildcard,
						relation: relation.name,
						relationComment: compactComment(relation.comment) || null,
						sourceDefinition: relation.parentDefinitionName,
						subject: subjectLabel,
						subjectDefinition: subjectType.subjectDefinitionName,
						subjectRelation,
						...caveatMetadata(
							caveatName ? caveatsByName.get(caveatName) : undefined,
						),
					},
				});
			}
		}
	}

	for (const dependency of input.dependencies ?? []) {
		const definitionId = definitionNodeId(dependency.permissionDefinitionName);
		const node = nodes.get(definitionId);

		if (node) {
			const dependencies = Array.isArray(node.metadata.permissionDependencies)
				? node.metadata.permissionDependencies
				: [];
			node.metadata.permissionDependencies = [
				...dependencies,
				`${dependency.permissionName} -> ${dependency.relation.definitionName}#${dependency.relation.relationName}`,
			];
		}
	}

	const graphNodes = Array.from(nodes.values());
	const graphEdges = Array.from(edges.values());

	return {
		mode: "schema",
		nodes: graphNodes,
		edges: graphEdges,
		readAt: input.readAt,
		truncated: false,
		stats: {
			nodeCount: graphNodes.length,
			edgeCount: graphEdges.length,
			definitionCount: input.definitions.length,
			relationCount: input.definitions.reduce(
				(total, definition) => total + definition.relations.length,
				0,
			),
			permissionCount: input.definitions.reduce(
				(total, definition) => total + definition.permissions.length,
				0,
			),
			caveatCount: input.caveats.length,
		},
	};
}

function subjectLabel(subject?: v1.SubjectReference) {
	if (!subject?.object) {
		return "unknown";
	}

	const relation = subject.optionalRelation
		? `#${subject.optionalRelation}`
		: "";

	return `${subject.object.objectType}:${subject.object.objectId}${relation}`;
}

export function createRelationshipGraph(
	input: RelationshipGraphInput,
): SpiceDbGraph {
	const nodes = new Map<string, SpiceDbGraphNode>();
	const edges = new Map<string, SpiceDbGraphEdge>();

	for (const relationship of input.relationships) {
		if (!relationship.resource || !relationship.subject?.object) {
			continue;
		}

		const resource = relationship.resource;
		const subject = relationship.subject.object;
		const resourceId = objectNodeId(resource.objectType, resource.objectId);
		const subjectId = objectNodeId(subject.objectType, subject.objectId);

		addNode(nodes, {
			id: resourceId,
			label: `${resource.objectType}:${resource.objectId}`,
			kind: "object",
			metadata: {
				objectType: resource.objectType,
				objectId: resource.objectId,
			},
		});

		addNode(nodes, {
			id: subjectId,
			label: `${subject.objectType}:${subject.objectId}`,
			kind: "object",
			metadata: {
				objectType: subject.objectType,
				objectId: subject.objectId,
				relation: relationship.subject.optionalRelation || null,
			},
		});

		addEdge(edges, {
			id: `relationship:${resourceId}:${relationship.relation}:${subjectLabel(
				relationship.subject,
			)}`,
			source: resourceId,
			target: subjectId,
			label: relationship.subject.optionalRelation
				? `${relationship.relation} -> #${relationship.subject.optionalRelation}`
				: relationship.relation,
			kind: "relationship",
			metadata: {
				resource: `${resource.objectType}:${resource.objectId}`,
				relation: relationship.relation,
				subject: subjectLabel(relationship.subject),
				caveat: relationship.optionalCaveat?.caveatName ?? null,
				expiresAt: relationship.optionalExpiresAt
					? `${relationship.optionalExpiresAt.seconds}`
					: null,
			},
		});
	}

	const graphNodes = Array.from(nodes.values());
	const graphEdges = Array.from(edges.values());

	return {
		mode: "relationships",
		nodes: graphNodes,
		edges: graphEdges,
		truncated: input.truncated,
		limit: input.limit,
		message: input.truncated
			? `Showing the first ${input.limit} relationships. Increase SPICEDB_RELATIONSHIP_EXPORT_LIMIT to inspect more.`
			: undefined,
		stats: {
			nodeCount: graphNodes.length,
			edgeCount: graphEdges.length,
			relationshipCount: input.relationships.length,
		},
	};
}
