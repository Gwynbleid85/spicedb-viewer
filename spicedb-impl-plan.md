# SpiceDB React Flow Visualizer Implementation Plan

## Summary

Add a protected, read-only SpiceDB visualizer that renders the current schema and relationship data as interactive React Flow graphs. Use `@authzed/authzed-node` only from server code, `@xyflow/react` for visualization, TanStack Query for client fetching, Zod-validated TanStack Start server functions, and existing shadcn/Tailwind tokens for UI.

## Key Changes

- Install `@authzed/authzed-node`, `@xyflow/react`, and `@dagrejs/dagre`.
- Configure SpiceDB with server-only environment variables: `SPICEDB_ENDPOINT`, `SPICEDB_TOKEN`, `SPICEDB_SECURITY`, optional `SPICEDB_CA_CERT_PATH`, and `SPICEDB_RELATIONSHIP_EXPORT_LIMIT`.
- Add a protected `/spicedb` route with `Schema` and `Relationships` modes.
- Represent schema definitions, relations, permissions, caveats, concrete objects, and relationships as graph DTOs suitable for React Flow.

## Implementation

- Server client lives under `src/server/spicedb/` and normalizes connection/config errors.
- Repository code calls `reflectSchema`, `dependentRelations`, and a capped `exportBulkRelationships` stream collector.
- Server function validates mode/limit with Zod and requires the existing Better Auth session.
- React components use TanStack Query plus `useServerFn`, custom React Flow nodes, Dagre layout, graph stats, refresh, truncation, empty, loading, and error states.

## Tests

- Unit tests cover schema graph mapping, caveat/dependency edges, relationship graph mapping, and truncation metadata.
- Verification commands: `bun run test`, `bun run check`, and `bun run build`.

## Assumptions

- The visualizer is read-only.
- Access is limited to authenticated users through the existing protected route layout.
- Relationship export is capped by default at `1000` relationships.
- The React Flow package is `@xyflow/react`, not the older `reactflow` package.
