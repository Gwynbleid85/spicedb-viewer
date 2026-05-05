# SpiceDB Viewer

A TanStack Start app for inspecting and managing a SpiceDB schema and relationship graph.

## Run

```bash
bun install
bun run dev
```

Open `http://localhost:3010`.

## Required environment

```bash
SPICEDB_ENDPOINT=localhost:50051
SPICEDB_TOKEN=your-token
SPICEDB_SECURITY=insecure-localhost # or secure
SPICEDB_RELATIONSHIP_EXPORT_LIMIT=1000
```

## Commands

```bash
bun run check
bun run test
bun run build
```
