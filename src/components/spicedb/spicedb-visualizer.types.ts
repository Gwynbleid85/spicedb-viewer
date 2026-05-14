import type { Edge, Node } from "@xyflow/react";

import type { SpiceDbGraphEdge, SpiceDbGraphNode } from "#/lib/spicedb-graph";

export type NodeColor = {
	badge: string;
	handle: string;
	node: string;
};

export type FlowNodeData = SpiceDbGraphNode & {
	color: NodeColor;
	onSelect: (node: SpiceDbGraphNode) => void;
	searchActive: boolean;
	searchMatched: boolean;
};

export type FlowNode = Node<FlowNodeData>;
export type FlowEdge = Edge<SpiceDbGraphEdge>;

export type SelectedGraphItem =
	| { item: SpiceDbGraphEdge; type: "edge" }
	| { item: SpiceDbGraphNode; type: "node" };

export type DeleteRelationshipRequest = {
	resourceId: string;
	resourceType: string;
	relation: string;
	subjectId: string;
	subjectRelation?: string;
	subjectType: string;
};

export type DeleteRelationshipMutationInput = DeleteRelationshipRequest & {
	edgeId: string;
};
