import { createFileRoute } from "@tanstack/react-router";

import { SpiceDbVisualizerPage } from "#/components/spicedb/spicedb-visualizer";

export const Route = createFileRoute("/")({
	component: SpiceDbVisualizerPage,
});
