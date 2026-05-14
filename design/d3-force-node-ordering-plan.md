# D3 Force Node Ordering Research and Implementation Plan

## Goal

Use `d3-force` to compute node positions/order on the SpiceDB graph canvas. This is a planning document only; no implementation has been made.

## Current implementation

- Canvas rendering lives in `src/components/spicedb/graph-canvas.tsx`.
  - `GraphCanvas` calls `layoutGraph(...)` inside `useMemo`.
  - `DraggableGraph` keeps React Flow node positions draggable and exposes an **Organize** button that resets to the computed layout.
- Layout generation lives in `src/components/spicedb/spicedb-graph-layout.ts`.
  - It currently imports `graphlib` and `layout` from `@dagrejs/dagre`.
  - `layoutGraph(...)` computes connected components, sorts component node ids, runs Dagre per component, converts Dagre center coordinates into React Flow top-left coordinates, resolves overlaps, then packs disconnected components into rows.
  - Edges are emitted as React Flow `type: "straight"` with arrow markers.
- Node sizing and spacing constants live in `src/components/spicedb/spicedb-visualizer.constants.ts`.
  - `nodeSizeByKind` provides rectangular node dimensions.
  - `nodeCollisionGap`, `componentGap`, and `maxLayoutRowWidth` control spacing and component packing.
- Tests for layout behavior live in `src/components/spicedb/spicedb-visualizer.test.ts`.
  - Existing expectations cover straight edges, search metadata, and packing disconnected relationship nodes into multiple rows.
- `package.json` currently includes `@dagrejs/dagre` but does not include `d3-force` or `@types/d3-force`.

## D3 force research notes

Verified via `npm view` on 2026-05-06:

- `d3-force` latest version is `3.0.0`.
- Package description: “Force-directed graph layout using velocity Verlet integration.”
- Runtime dependencies are `d3-dispatch`, `d3-quadtree`, and `d3-timer`.
- The package homepage is `https://d3js.org/d3-force/`.
- TypeScript definitions are provided separately by `@types/d3-force`; latest checked version is `3.0.10`.

Relevant API behavior from the package README:

- `forceSimulation(nodes)` creates a simulation and starts it automatically.
- For static layout computation, call `simulation.stop()` and then `simulation.tick(iterations)` manually.
- The default natural tick count is 300.
- `simulation.tick(...)` does not dispatch events when run manually.
- `forceLink(links)` supports `source` and `target` initialized as string identifiers when configured with `.id(...)`.
- `forceCollide(radius)` treats nodes as circles and prevents overlap using an iterative soft constraint.
- `forceManyBody()` adds global attraction or repulsion, using a Barnes-Hut approximation for performance.
- `forceX(...)` and `forceY(...)` can pull nodes toward target x/y lanes with configurable strength.
- The README recommends computing static layouts for large graphs in a Web Worker to avoid freezing the UI.

## Recommended layout strategy

Replace the Dagre phase inside `layoutGraph(...)` with a deterministic, synchronous static `d3-force` simulation per connected component.

Keep the rest of the current layout contract intact:

1. Preserve `layoutGraph(...)` as the public entry point.
2. Preserve `createConnectedComponents(...)`, node coloring, React Flow node/edge shape, edge styling, search metadata, and `packLayoutComponents(...)`.
3. Replace only the per-component Dagre positioning step.
4. Keep component packing after force simulation so disconnected subgraphs remain readable and bounded by `maxLayoutRowWidth`.

### Force setup

Use these forces as the starting point:

- `forceLink(componentLinks)`
  - `.id((node) => node.id)`
  - `distance` based on edge kind:
    - relationship edges: about `240`
    - schema edges: about `200`
  - `strength` around `0.45` to keep connected nodes near each other without making the layout too rigid.
- `forceManyBody()`
  - Negative strength to repel nodes.
  - Start around `-650` for schema graphs and `-520` for relationship graphs.
  - Consider `.distanceMax(900)` for large graphs to reduce global drift and improve performance.
- `forceCollide(...)`
  - D3 collision is circular, while React Flow nodes are rectangular.
  - Use a radius derived from the node rectangle diagonal:
    - `Math.hypot(width, height) / 2 + nodeCollisionGap`
  - Use `.iterations(2)` or `.iterations(3)` if overlaps remain.
- `forceX(...)` and `forceY(...)`
  - For `schema` mode, keep a loose left-to-right order by anchoring nodes to x lanes derived from graph depth/rank.
  - For `relationships` mode, keep a top-to-bottom or center-biased grouping by anchoring object types or degree groups.
  - Use low-to-medium strength (`0.04`–`0.12`) so forces can still separate dense clusters.

### Determinism

D3 initializes missing positions with deterministic phyllotaxis, but the output can still be sensitive to input order. Preserve deterministic ordering by:

1. Continuing to call `sortComponentIds(...)` before creating simulation nodes.
2. Seeding each simulation node with an initial `x`/`y` based on the sorted index instead of leaving positions undefined.
3. Running a fixed number of manual ticks, e.g. `simulation.stop().tick(300)`.
4. Avoiding async ticking in React state; compute the final static layout before rendering.

### Direction/order semantics

Dagre currently gives stronger directed graph semantics than raw force layout. To retain “ordering nodes on the canvas,” add lightweight rank/lane targets before the simulation:

- Build adjacency from component edges.
- For schema mode:
  - Compute a depth from source to target edges where possible.
  - Use definitions with no incoming edges as depth `0`.
  - For cycles, fall back to the existing sorted order and/or degree.
  - Target x = `depth * 300`.
  - Target y = sorted index within the depth group * `130`.
- For relationship mode:
  - Group by `metadata.objectType` first, then by degree and `objectId`.
  - Target y = group index * `180`.
  - Target x = sorted index within the group * `260`, wrapped for large groups if needed.

These targets should be implemented as helper functions so the rank/group logic is testable without running a full simulation.

## Proposed file changes

### `package.json`

Add dependencies:

```json
"d3-force": "^3.0.0"
```

Add dev dependency:

```json
"@types/d3-force": "^3.0.10"
```

Then run `bun install` to update `bun.lock`.

### `src/components/spicedb/spicedb-graph-layout.ts`

Refactor in small steps:

1. Replace Dagre imports with D3 force imports:

```ts
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
```

2. Add internal simulation node/link types:

```ts
type ForceLayoutNode = SimulationNodeDatum & {
  id: string;
  graphNode: SpiceDbGraphNode;
  height: number;
  targetX: number;
  targetY: number;
  width: number;
};

type ForceLayoutLink = SimulationLinkDatum<ForceLayoutNode> & {
  kind: SpiceDbGraphEdge["kind"];
  source: string;
  target: string;
};
```

3. Add helper functions:

- `createForceLayoutTargets(...)`
- `createForceSimulationNodes(...)`
- `createForceSimulationLinks(...)`
- `runForceLayout(...)`
- `toFlowNode(...)` or keep conversion inline.

4. In `layoutGraph(...)`, replace:

- `new graphlib.Graph()` setup
- `dagre.setNode(...)`
- `dagre.setEdge(...)`
- `layout(dagre)`
- `dagre.node(id)` reads

with:

- create force nodes from ordered component ids
- create force links from component edges
- run a stopped simulation for a fixed tick count
- convert final center coordinates into React Flow top-left positions using `x - width / 2`, `y - height / 2`
- keep `positionNodesWithoutOverlap(...)` as a final guard, at least for the first implementation

### `src/components/spicedb/spicedb-visualizer.test.ts`

Add or update tests:

1. Existing tests should still pass:
   - edges remain `straight`
   - search metadata is preserved
   - disconnected relationship nodes still pack across multiple rows
2. Add deterministic layout test:
   - calling `layoutGraph(...)` twice with the same graph returns the same positions.
3. Add no-overlap test for a dense component:
   - compute bounds from `node.position` plus `node.style.width/height`
   - assert no two nodes overlap.
4. Add ordering test:
   - schema graph `A -> B -> C` should position `A.x < B.x < C.x`.
   - relationship grouping can be tested separately if relationship mode gets type lanes.

## Performance considerations

- Static synchronous `simulation.tick(300)` is likely fine for the current relationship export limit defaults, but can freeze the UI for large graphs.
- If the graph commonly reaches hundreds or thousands of nodes, plan a second phase that runs the simulation in a Web Worker and returns positions asynchronously.
- Avoid live simulation updates in React Flow for the first implementation; they add state complexity and make tests less deterministic.
- Keep `packLayoutComponents(...)` so force simulation only handles connected subgraphs, not all disconnected components at once.

## Risks and mitigations

- **Risk: weaker directed hierarchy than Dagre.**
  - Mitigation: compute explicit depth/group target lanes and use `forceX`/`forceY` to preserve readable order.
- **Risk: rectangular nodes can still overlap because `forceCollide` is circular.**
  - Mitigation: use diagonal radius plus `nodeCollisionGap`, keep `positionNodesWithoutOverlap(...)`, and add a dense graph test.
- **Risk: layout becomes unstable or changes between renders.**
  - Mitigation: sort inputs, seed initial positions, fixed tick count, synchronous stopped simulation.
- **Risk: large graph UI jank.**
  - Mitigation: keep per-component simulation, consider graph-size-dependent tick counts, and move to a Web Worker if needed.
- **Risk: bundle size increase.**
  - Mitigation: import only from `d3-force`, not the umbrella `d3` package.

## Implementation sequence

1. Add `d3-force` and `@types/d3-force`; run `bun install`.
2. Refactor `spicedb-graph-layout.ts` to isolate the existing Dagre-specific code behind a small layout helper, then replace that helper with D3 force logic.
3. Add deterministic target/ranking helpers for schema and relationship modes.
4. Keep existing overlap and packing helpers in place.
5. Update tests for determinism, no overlap, and basic ordering.
6. Run:

```bash
bun run test
bun run check
bun run build
```

7. If layout quality is poor on real data, tune force constants in `spicedb-visualizer.constants.ts` or a dedicated layout constants section in `spicedb-graph-layout.ts`.
